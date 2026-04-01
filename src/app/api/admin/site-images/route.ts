import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

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

// POST /api/admin/site-images — upsert a mega image by key
export async function POST(req: NextRequest) {
    const user = await requireAdminRouteAccess(req);
    if (user instanceof NextResponse) {
        return user;
    }

    const body = await req.json();
    const { key, value, remark } = body as {
        key: string;
        value: string;
        remark?: string;
    };

    if (!key || !key.startsWith("mega-")) {
        return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const item = await prisma.siteSetting.upsert({
        where: { key },
        update: { value: value || null, remark: remark || null },
        create: { key, value: value || null, remark: remark || null },
    });

    return NextResponse.json(item);
}
