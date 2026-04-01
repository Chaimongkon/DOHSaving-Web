import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { clearSessionCookies } from "@/lib/sessionCookie";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const ipAddress = getAuditIpAddress(req);

  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;

  if (payload && token) {
    const result = await prisma.user.updateMany({
      where: {
        id: payload.userId,
        sessionToken: token,
      },
      data: {
        sessionToken: null,
      },
    });

    await writeAuditLog({
      userId: payload.userId,
      action: "logout",
      tableName: "auth_sessions",
      ipAddress,
      newValues: {
        revokedSession: result.count > 0,
      },
    });
  }

  clearSessionCookies(response);

  return response;
}