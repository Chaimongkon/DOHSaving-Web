import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// POST /api/cookie-consent — บันทึกความยินยอม cookie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consentStatus, cookieCategories } = body;

    // ใช้ cookie เก็บ visitorId สำหรับ anonymous user
    let visitorId = req.cookies.get("visitor_id")?.value;
    if (!visitorId) {
      visitorId = uuidv4();
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || null;

    // Upsert — อัปเดตถ้ามี visitorId เดิม
    const existing = await prisma.cookieConsent.findFirst({
      where: { userId: visitorId },
      orderBy: { createdAt: "desc" },
    });

    let record;
    if (existing) {
      record = await prisma.cookieConsent.update({
        where: { id: existing.id },
        data: {
          consentStatus,
          cookieCategories: cookieCategories || null,
          ipAddress: ip,
          userAgent: userAgent?.slice(0, 255) || null,
        },
      });
    } else {
      record = await prisma.cookieConsent.create({
        data: {
          userId: visitorId,
          consentStatus,
          cookieCategories: cookieCategories || null,
          ipAddress: ip,
          userAgent: userAgent?.slice(0, 255) || null,
        },
      });
    }

    const res = NextResponse.json({ success: true, id: record.id });
    // Set visitor_id cookie (1 year)
    res.cookies.set("visitor_id", visitorId, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    // Set cookie_consent cookie สำหรับ frontend ตรวจสอบ
    res.cookies.set("cookie_consent", consentStatus ? "accepted" : "rejected", {
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Failed to save cookie consent:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// GET /api/cookie-consent — ตรวจสอบสถานะ cookie consent
export async function GET(req: NextRequest) {
  try {
    const visitorId = req.cookies.get("visitor_id")?.value;
    if (!visitorId) {
      return NextResponse.json({ hasConsent: false });
    }

    const record = await prisma.cookieConsent.findFirst({
      where: { userId: visitorId },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ hasConsent: false });
    }

    return NextResponse.json({
      hasConsent: true,
      consentStatus: record.consentStatus,
      cookieCategories: record.cookieCategories,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error("Failed to check cookie consent:", error);
    return NextResponse.json({ hasConsent: false }, { status: 500 });
  }
}
