import type { NextRequest, NextResponse } from "next/server";

export const LEGACY_SESSION_COOKIE_NAME = "token";
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-token"
    : LEGACY_SESSION_COOKIE_NAME;

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const IS_SECURE_COOKIE = process.env.NODE_ENV === "production";

function getCookieNames(): string[] {
  return SESSION_COOKIE_NAME === LEGACY_SESSION_COOKIE_NAME
    ? [SESSION_COOKIE_NAME]
    : [SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME];
}

export function getSessionCookieValue(
  req: Pick<NextRequest, "cookies">
): string | null {
  for (const cookieName of getCookieNames()) {
    const token = req.cookies.get(cookieName)?.value;
    if (token) return token;
  }

  return null;
}

export function setSessionCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_SECURE_COOKIE,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  if (SESSION_COOKIE_NAME !== LEGACY_SESSION_COOKIE_NAME) {
    response.cookies.set(LEGACY_SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: IS_SECURE_COOKIE,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
}

export function clearSessionCookies(response: NextResponse): void {
  for (const cookieName of getCookieNames()) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: IS_SECURE_COOKIE,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
}
