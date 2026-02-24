import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /MemberMedia/File/[filename] — redirect URL เก่าไปไฟล์ใหม่
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // ค้นหาจาก legacyPath (ชื่อไฟล์เก่า เช่น d1e18c72-3a85-44c0-8b56-4006d934c177.pdf)
    const media = await prisma.memberMedia.findFirst({
      where: { legacyPath: filename },
      select: { filePath: true },
    });

    if (media?.filePath) {
      // 301 Permanent Redirect → ไฟล์ใหม่
      return NextResponse.redirect(new URL(media.filePath, _req.url), 301);
    }

    // ไม่พบ — แสดงหน้า 404
    return new NextResponse("ไม่พบไฟล์ที่ร้องขอ", { status: 404 });
  } catch (error) {
    console.error("Legacy redirect error:", error);
    return new NextResponse("เกิดข้อผิดพลาด", { status: 500 });
  }
}
