import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { getAuditIpAddress, writeAuditLog } from "@/lib/auditLog";
import prisma from "@/lib/prisma";

/** ช่องรูปของเมนูหลักที่มีแผงเมนูย่อย — ตรงกับ key ใน components/layout/Navbar.tsx (mega-<key>) */
const KEYS = new Set(["mega-about", "mega-services", "mega-news", "mega-documents", "mega-contact"]);

// GET /api/admin/site-images — get all mega image settings
export async function GET(req: NextRequest) {
    const user = await requireAdminRouteAccess(req);
    if (user instanceof NextResponse) {
        return user;
    }

    const items = await prisma.siteSetting.findMany({
        where: { key: { startsWith: "mega-" } },
        orderBy: { key: "asc" },
    });

    return NextResponse.json(items);
}

// POST /api/admin/site-images { key, value, remark } — ตั้งรูป · value ว่าง = กลับไปใช้รูปเริ่มต้นของเมนู
export async function POST(req: NextRequest) {
    const user = await requireAdminRouteAccess(req);
    if (user instanceof NextResponse) {
        return user;
    }

    const body = await req.json().catch(() => ({}));
    const { key, value, remark } = body as {
        key: string;
        value: string;
        remark?: string;
    };

    if (!key || !KEYS.has(key)) {
        return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    // รับเฉพาะไฟล์ที่อัปโหลดผ่านระบบ (กันใส่ลิงก์รูปจากเว็บอื่น)
    if (value && (typeof value !== "string" || !/^\/uploads\/mega-images\/[\w.-]+$/.test(value))) {
        return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
    }

    const existing = await prisma.siteSetting.findUnique({ where: { key } });
    const item = await prisma.siteSetting.upsert({
        where: { key },
        update: { value: value || null, remark: remark || existing?.remark || null },
        create: { key, value: value || null, remark: remark || null },
    });

    await writeAuditLog({
        userId: user.userId,
        action: value ? "update" : "delete",
        tableName: "site_settings",
        recordId: item.id,
        ipAddress: getAuditIpAddress(req),
        oldValues: { key, value: existing?.value ?? null },
        newValues: { key, value: item.value },
    });

    return NextResponse.json(item);
}
