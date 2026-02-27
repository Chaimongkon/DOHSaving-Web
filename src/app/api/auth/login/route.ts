import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userName, password } = await req.json();

    if (!userName || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ค้นหา user
    const user = await prisma.user.findUnique({
      where: { userName },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ตรวจสอบ account locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: "บัญชีถูกล็อคชั่วคราว กรุณาลองใหม่ภายหลัง" },
        { status: 423 }
      );
    }

    // ตรวจสอบ password
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      // เพิ่ม failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = {
        failedLoginAttempts: failedAttempts,
      };

      // ล็อคบัญชีหลัง 5 ครั้ง (30 นาที)
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Login สำเร็จ — reset failed attempts + update session
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
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        sessionToken: token,
      },
    });

    // ส่ง token ใน cookie + response
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

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false, // TODO: เปลี่ยนกลับเป็น true เมื่อติดตั้ง SSL แล้ว
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
