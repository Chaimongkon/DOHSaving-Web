import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/site-images — public endpoint, returns mega images
export async function GET() {
    const items = await prisma.siteSetting.findMany({
        where: { key: { startsWith: "mega-" } },
        select: { key: true, value: true },
    });

    // Convert to a simple key-value object
    const map: Record<string, string> = {};
    for (const item of items) {
        if (item.value) {
            map[item.key] = item.value;
        }
    }

    return NextResponse.json(map, {
        headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
    });
}
