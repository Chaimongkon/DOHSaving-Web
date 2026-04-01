import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { clearSessionCookies } from "@/lib/sessionCookie";

// POST /api/auth/logout — ล้าง cookie token
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;

  if (payload && token) {
    await prisma.user.updateMany({
      where: {
        id: payload.userId,
        sessionToken: token,
      },
      data: {
        sessionToken: null,
      },
    });
  }

  clearSessionCookies(response);

  return response;
}
