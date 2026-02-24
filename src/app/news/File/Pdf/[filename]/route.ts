import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /News/File/Pdf/[filename] — redirect URL เก่าข่าวประชาสัมพันธ์
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    const news = await prisma.news.findFirst({
      where: { legacyPath: filename },
      select: { pdfPath: true, id: true },
    });

    // ถ้ามี pdfPath → redirect ไปไฟล์ใหม่
    if (news?.pdfPath) {
      return NextResponse.redirect(new URL(news.pdfPath, _req.url), 301);
    }

    // ถ้ามีข่าวแต่ไม่มี pdf → redirect ไปหน้าข่าว
    if (news?.id) {
      return NextResponse.redirect(new URL(`/news/${news.id}`, _req.url), 301);
    }

    return new NextResponse("ไม่พบไฟล์ที่ร้องขอ", { status: 404 });
  } catch (error) {
    console.error("Legacy redirect error (News):", error);
    return new NextResponse("เกิดข้อผิดพลาด", { status: 500 });
  }
}
