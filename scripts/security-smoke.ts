import "dotenv/config";
import jwt from "jsonwebtoken";

type StepResult = {
  step: string;
  status: "PASS" | "FAIL";
  detail: string;
};

class CookieJar {
  private cookies = new Map<string, string>();

  set(name: string, value: string) {
    this.cookies.set(name, value);
  }

  setFromResponse(response: Response) {
    const getSetCookie = (response.headers as Headers & {
      getSetCookie?: () => string[];
    }).getSetCookie;

    const setCookies = getSetCookie
      ? getSetCookie.call(response.headers)
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];

    for (const entry of setCookies) {
      const [cookiePart] = entry.split(";", 1);
      const separatorIndex = cookiePart.indexOf("=");
      if (separatorIndex <= 0) continue;

      const name = cookiePart.slice(0, separatorIndex).trim();
      const value = cookiePart.slice(separatorIndex + 1).trim();

      if (!value) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  toHeader(): string | null {
    if (this.cookies.size === 0) return null;

    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function request(
  url: string,
  init: RequestInit,
  jar?: CookieJar
): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookieHeader = jar?.toHeader();

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    redirect: "manual",
  });

  jar?.setFromResponse(response);
  return response;
}

async function run() {
  const appUrl = getRequiredEnv("APP_URL").replace(/\/$/, "");
  const adminUsername = getRequiredEnv("ADMIN_USERNAME");
  const adminPassword = getRequiredEnv("ADMIN_PASSWORD");
  const jwtSecret = process.env.JWT_SECRET?.trim();

  const results: StepResult[] = [];
  const jar = new CookieJar();

  const loginResponse = await request(
    `${appUrl}/api/auth/login`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userName: adminUsername,
        password: adminPassword,
      }),
    },
    jar
  );

  results.push({
    step: "login",
    status: loginResponse.status === 200 ? "PASS" : "FAIL",
    detail: `status=${loginResponse.status}`,
  });

  const meResponse = await request(`${appUrl}/api/auth/me`, { method: "GET" }, jar);
  results.push({
    step: "me_after_login",
    status: meResponse.status === 200 ? "PASS" : "FAIL",
    detail: `status=${meResponse.status}`,
  });

  const adminResponse = await request(`${appUrl}/admin`, { method: "GET" }, jar);
  results.push({
    step: "admin_after_login",
    status: adminResponse.status === 200 ? "PASS" : "FAIL",
    detail: `status=${adminResponse.status}`,
  });

  if (jwtSecret) {
    const fakeToken = jwt.sign(
      {
        userId: 1,
        userName: adminUsername,
        userRole: "admin",
        fullName: adminUsername,
      },
      jwtSecret,
      { expiresIn: "8h" }
    );

    const fakeJar = new CookieJar();
    fakeJar.set("token", fakeToken);
    const revokedResponse = await request(
      `${appUrl}/api/admin/news`,
      { method: "GET" },
      fakeJar
    );

    results.push({
      step: "revoked_session_rejected",
      status: revokedResponse.status === 401 ? "PASS" : "FAIL",
      detail: `status=${revokedResponse.status}`,
    });
  }

  const logoutResponse = await request(
    `${appUrl}/api/auth/logout`,
    { method: "POST" },
    jar
  );
  results.push({
    step: "logout",
    status: logoutResponse.status === 200 ? "PASS" : "FAIL",
    detail: `status=${logoutResponse.status}`,
  });

  const meAfterLogoutResponse = await request(
    `${appUrl}/api/auth/me`,
    { method: "GET" },
    jar
  );
  results.push({
    step: "me_after_logout",
    status: meAfterLogoutResponse.status === 401 ? "PASS" : "FAIL",
    detail: `status=${meAfterLogoutResponse.status}`,
  });

  const adminAfterLogoutResponse = await request(
    `${appUrl}/admin`,
    { method: "GET" },
    jar
  );
  results.push({
    step: "admin_after_logout",
    status:
      adminAfterLogoutResponse.status === 307 ||
      adminAfterLogoutResponse.status === 302
        ? "PASS"
        : "FAIL",
    detail: `status=${adminAfterLogoutResponse.status}`,
  });

  for (const result of results) {
    console.log(`[${result.status}] ${result.step} ${result.detail}`);
  }

  if (results.some((result) => result.status === "FAIL")) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
