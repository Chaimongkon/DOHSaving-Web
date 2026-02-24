import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /BusinessReport/File/Pdf/[filename] — redirect URL เก่ารายงานประจำปี
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // ค้นหาจาก AnnualReport (ตาราง annual_reports ที่ admin ใช้)
    // redirect ไปหน้า ebook แทนไฟล์ PDF ตรงๆ
    const annual = await prisma.annualReport.findFirst({
      where: { legacyPath: filename },
      select: { id: true },
    });

    if (annual) {
      return NextResponse.redirect(new URL(`/annual-reports/${annual.id}`, _req.url), 302);
    }

    // Fallback: ค้นหาจาก BusinessReport (ตารางเก่า)
    const report = await prisma.businessReport.findFirst({
      where: { legacyPath: filename },
      select: { filePath: true },
    });

    if (report?.filePath) {
      // พยายามหา AnnualReport ที่มี fileUrl ตรงกัน → redirect ไปหน้า ebook
      const matchedAnnual = await prisma.annualReport.findFirst({
        where: { fileUrl: report.filePath },
        select: { id: true },
      });
      if (matchedAnnual) {
        return NextResponse.redirect(new URL(`/annual-reports/${matchedAnnual.id}`, _req.url), 302);
      }
      // ถ้าไม่เจอ AnnualReport ที่ตรงกัน → redirect ไป PDF
      return NextResponse.redirect(new URL(report.filePath, _req.url), 302);
    }

    return new NextResponse("ไม่พบไฟล์ที่ร้องขอ", { status: 404 });
  } catch (error) {
    console.error("Legacy redirect error (BusinessReport):", error);
    return new NextResponse("เกิดข้อผิดพลาด", { status: 500 });
  }
}
