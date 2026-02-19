import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── XSS Sanitizer — strip dangerous HTML/script tags ───
function sanitize(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ─── Input length limits ───
const MAX_LEN = {
  memberId: 50,
  name: 255,
  tel: 20,
  email: 255,
  category: 50,
  subject: 500,
  detail: 5000,
};

function truncate(val: string, max: number): string {
  return val.length > max ? val.slice(0, max) : val;
}

// ─── Simple in-memory rate limiter ───
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Track lookup rate limiter (10 per minute per IP — anti brute-force)
const trackLimitMap = new Map<string, number[]>();
const TRACK_LIMIT = 10;
const TRACK_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function isTrackLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = trackLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < TRACK_WINDOW_MS);
  trackLimitMap.set(ip, recent);
  if (recent.length >= TRACK_LIMIT) return true;
  recent.push(now);
  trackLimitMap.set(ip, recent);
  return false;
}

function generateTrackingCode(): string {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `CP${y}${m}${d}-${rand}`;
}

// POST /api/complaints — submit new complaint (public)
export async function POST(req: NextRequest) {
  try {
    // ── Security Layer 1: Content-Type check ──
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
    }

    // ── Security Layer 2: Rate limit ──
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "ส่งเรื่องได้สูงสุด 3 เรื่องต่อชั่วโมง กรุณาลองใหม่ภายหลัง" },
        { status: 429 }
      );
    }

    // ── Security Layer 3: Body size limit (max 10KB) ──
    const rawBody = await req.text();
    if (rawBody.length > 10240) {
      return NextResponse.json({ error: "ข้อมูลมีขนาดใหญ่เกินไป" }, { status: 413 });
    }

    const body = JSON.parse(rawBody);

    // ── Security Layer 4: Honeypot bot trap ──
    if (body._website || body._url || body._hp) {
      // Bot filled hidden field — silently reject with fake success
      return NextResponse.json({ ok: true, trackingCode: "CP000000-0000", message: "ส่งข้อมูลสำเร็จ" }, { status: 201 });
    }

    const { memberId, name, tel, email, category, subject, complaint: detail } = body;

    if (!subject || !detail) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อและรายละเอียด" }, { status: 400 });
    }

    // Validate category whitelist
    const allowedCategories = ["complaint", "suggestion", "inquiry"];
    const safeCategory = allowedCategories.includes(category) ? category : "complaint";

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
    }

    // Validate tel format if provided (digits, dashes, spaces only)
    if (tel && !/^[\d\s\-+()]{0,20}$/.test(tel.trim())) {
      return NextResponse.json({ error: "รูปแบบเบอร์โทรไม่ถูกต้อง" }, { status: 400 });
    }

    const trackingCode = generateTrackingCode();

    const record = await prisma.complaint.create({
      data: {
        trackingCode,
        memberId: memberId ? truncate(sanitize(memberId.trim()), MAX_LEN.memberId) : null,
        name: name?.trim() ? truncate(sanitize(name.trim()), MAX_LEN.name) : "ผู้ไม่ประสงค์ออกนาม",
        tel: tel ? truncate(sanitize(tel.trim()), MAX_LEN.tel) : null,
        email: email ? truncate(email.trim().toLowerCase(), MAX_LEN.email) : null,
        category: safeCategory,
        subject: truncate(sanitize(subject.trim()), MAX_LEN.subject),
        complaint: truncate(sanitize(detail.trim()), MAX_LEN.detail),
      },
    });

    return NextResponse.json({
      ok: true,
      trackingCode: record.trackingCode,
      message: "ส่งข้อมูลสำเร็จ",
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create complaint:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// GET /api/complaints?code=XXXX — check status by tracking code (public)
export async function GET(req: NextRequest) {
  try {
    // Anti brute-force rate limit
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isTrackLimited(ip)) {
      return NextResponse.json(
        { error: "ค้นหาได้สูงสุด 10 ครั้งต่อนาที กรุณาลองใหม่ภายหลัง" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "กรุณาระบุรหัสติดตาม" }, { status: 400 });
    }

    // Validate tracking code format (CP + 6 digits + dash + 4 digits)
    if (!/^CP\d{6}-\d{4}$/.test(code)) {
      return NextResponse.json({ error: "รูปแบบรหัสติดตามไม่ถูกต้อง" }, { status: 400 });
    }

    const record = await prisma.complaint.findUnique({
      where: { trackingCode: code },
      select: {
        trackingCode: true,
        category: true,
        subject: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    return NextResponse.json({ complaint: record });
  } catch (error) {
    console.error("Failed to get complaint:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
