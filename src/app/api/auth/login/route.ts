import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import { getClientIp } from "@/lib/requestIp";
import { clearSessionCookies, setSessionCookie } from "@/lib/sessionCookie";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(req: NextRequest) {
  try {
    const ipAddress = getClientIp(req);
    const { userName, password } = await req.json();

    if (!userName || !password) {
      await writeAuditLog({
        action: "login_failed",
        tableName: "auth_sessions",
        ipAddress,
        newValues: { userName: userName || null, reason: "missing_credentials" },
      });

      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { userName },
    });

    if (!user || !user.isActive) {
      await writeAuditLog({
        userId: user?.id ?? null,
        action: "login_failed",
        tableName: "auth_sessions",
        ipAddress,
        newValues: { userName, reason: "invalid_user" },
      });

      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await writeAuditLog({
        userId: user.id,
        action: "login_blocked",
        tableName: "auth_sessions",
        ipAddress,
        newValues: {
          userName,
          reason: "account_locked",
          lockedUntil: user.lockedUntil,
        },
      });

      return NextResponse.json(
        { error: "บัญชีถูกล็อคชั่วคราว กรุณาลองใหม่ภายหลัง" },
        { status: 423 }
      );
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: {
        failedLoginAttempts: number;
        lockedUntil?: Date;
      } = {
        failedLoginAttempts: failedAttempts,
      };

      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await writeAuditLog({
        userId: user.id,
        action: "login_failed",
        tableName: "auth_sessions",
        ipAddress,
        newValues: {
          userName,
          reason: "invalid_password",
          failedLoginAttempts: failedAttempts,
          lockedUntil: updateData.lockedUntil ?? null,
        },
      });

      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      userName: user.userName,
      userRole: user.userRole || "viewer",
      fullName: user.fullName || user.userName,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        ipAddress,
        sessionToken: token,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "login_success",
      tableName: "auth_sessions",
      ipAddress,
      newValues: {
        userName: user.userName,
        userRole: user.userRole || "viewer",
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        userName: user.userName,
        fullName: user.fullName,
        userRole: user.userRole,
        avatarPath: user.avatarPath,
        mustChangePassword: user.mustChangePassword,
      },
    });

    clearSessionCookies(response);
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}