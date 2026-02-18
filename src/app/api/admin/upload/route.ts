import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST /api/admin/upload — อัพโหลดไฟล์รูปภาพ
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ภาพ (jpg, png, webp, gif, svg)" },
        { status: 400 }
      );
    }

    // ขนาดไม่เกิน 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    // สร้างชื่อไฟล์ unique
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    // สร้าง directory ถ้ายังไม่มี
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    // เขียนไฟล์
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // คืน URL สำหรับเข้าถึงไฟล์
    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "อัพโหลดไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}
