import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ป้องกันเฉพาะ /admin routes (ยกเว้น /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      // Token หมดอายุหรือไม่ถูกต้อง
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
      response.cookies.set("token", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  // ป้องกัน /api/admin routes
  if (pathname.startsWith("/api/admin")) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
