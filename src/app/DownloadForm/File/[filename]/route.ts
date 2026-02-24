import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /DownloadForm/File/[filename] — redirect URL เก่าดาวน์โหลดแบบฟอร์ม
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // ค้นหาจาก Form model (ตาราง forms ที่ admin ใช้)
    const formItem = await prisma.form.findFirst({
      where: { legacyPath: filename },
      select: { fileUrl: true },
    });

    if (formItem?.fileUrl) {
      return NextResponse.redirect(new URL(formItem.fileUrl, _req.url), 301);
    }

    // Fallback: ค้นหาจาก FormDownload (ตารางเก่า) ด้วย
    const legacy = await prisma.formDownload.findFirst({
      where: { legacyPath: filename },
      select: { filePath: true },
    });

    if (legacy?.filePath) {
      return NextResponse.redirect(new URL(legacy.filePath, _req.url), 301);
    }

    return new NextResponse("ไม่พบไฟล์ที่ร้องขอ", { status: 404 });
  } catch (error) {
    console.error("Legacy redirect error (DownloadForm):", error);
    return new NextResponse("เกิดข้อผิดพลาด", { status: 500 });
  }
}
