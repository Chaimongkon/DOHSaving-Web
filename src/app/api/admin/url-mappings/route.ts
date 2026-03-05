import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

export async function GET() {
    try {
        const rawMappings = await prisma.siteSetting.findMany({
            where: { key: { startsWith: "url_translation:" } },
            orderBy: { key: "asc" },
        });

        const mappings = rawMappings.map((m) => ({
            id: m.id,
            url: m.key.replace("url_translation:", ""),
            thaiName: m.value,
            remark: m.remark,
            updatedAt: m.updatedAt,
        }));

        return NextResponse.json(mappings);
    } catch (error) {
        console.error("GET URL Mappings error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url, thaiName } = await request.json();
        if (!url || !thaiName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure URL starts with /
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        const key = `url_translation:${cleanUrl}`;

        const newMapping = await prisma.siteSetting.upsert({
            where: { key },
            update: { value: thaiName },
            create: {
                key,
                value: thaiName,
                remark: `คำแปลชื่อหน้าของ URL: ${cleanUrl}`,
            },
        });

        return NextResponse.json(newMapping);
    } catch (error) {
        console.error("POST URL Mappings error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await prisma.siteSetting.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE URL Mappings error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
