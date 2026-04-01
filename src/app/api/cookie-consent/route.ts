import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { getClientIp } from "@/lib/requestIp";

const isSecureCookie = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consentStatus, cookieCategories } = body;

    let visitorId = req.cookies.get("visitor_id")?.value;
    if (!visitorId) {
      visitorId = uuidv4();
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || null;

    const existing = await prisma.cookieConsent.findFirst({
      where: { userId: visitorId },
      orderBy: { createdAt: "desc" },
    });

    const record = existing
      ? await prisma.cookieConsent.update({
          where: { id: existing.id },
          data: {
            consentStatus,
            cookieCategories: cookieCategories || null,
            ipAddress: ip,
            userAgent: userAgent?.slice(0, 255) || null,
          },
        })
      : await prisma.cookieConsent.create({
          data: {
            userId: visitorId,
            consentStatus,
            cookieCategories: cookieCategories || null,
            ipAddress: ip,
            userAgent: userAgent?.slice(0, 255) || null,
          },
        });

    const res = NextResponse.json({ success: true, id: record.id });
    res.cookies.set("visitor_id", visitorId, {
      httpOnly: true,
      secure: isSecureCookie,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    res.cookies.set("cookie_consent", consentStatus ? "accepted" : "rejected", {
      secure: isSecureCookie,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Failed to save cookie consent:", error);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const visitorId = req.cookies.get("visitor_id")?.value;
    if (!visitorId) {
      return Response.json({ hasConsent: false });
    }

    const record = await prisma.cookieConsent.findFirst({
      where: { userId: visitorId },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return Response.json({ hasConsent: false });
    }

    return Response.json({
      hasConsent: true,
      consentStatus: record.consentStatus,
      cookieCategories: record.cookieCategories,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error("Failed to check cookie consent:", error);
    return Response.json({ hasConsent: false }, { status: 500 });
  }
}