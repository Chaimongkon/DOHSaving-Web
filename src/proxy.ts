import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  clearSessionCookies,
  getSessionCookieValue,
} from "@/lib/sessionCookie";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

async function hasActiveSession(req: NextRequest, token: string) {
  try {
    const sessionCheckUrl = new URL("/api/auth/session", req.url);
    const response = await fetch(sessionCheckUrl, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        "x-session-check": "1",
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

function unauthorizedApiResponse(message: string) {
  const response = NextResponse.json({ error: message }, { status: 401 });
  clearSessionCookies(response);
  return response;
}

function redirectToAdminLogin(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", req.url));
  clearSessionCookies(response);
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = getSessionCookieValue(req);

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return redirectToAdminLogin(req);
    }

    if (!(await hasActiveSession(req, token))) {
      return redirectToAdminLogin(req);
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const token = getSessionCookieValue(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return unauthorizedApiResponse("Token expired");
    }

    if (!(await hasActiveSession(req, token))) {
      return unauthorizedApiResponse("Session expired");
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
