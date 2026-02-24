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
    // Sanitize folder to prevent path traversal (only allow a-z, 0-9, hyphens)
    const rawFolder = (formData.get("folder") as string) || "general";
    const folder = rawFolder.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50) || "general";

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
      "application/pdf",
      "application/json",
    ];
    const isJson = file.name.endsWith(".json") || file.type === "application/json";
    if (!allowedTypes.includes(file.type) && !isJson) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ภาพ (jpg, png, webp, gif, svg), PDF และ JSON (Lottie)" },
        { status: 400 }
      );
    }

    // ขนาดไม่เกิน 100MB สำหรับ PDF, 5MB สำหรับ JSON, 10MB สำหรับรูปภาพ
    const maxSize = file.type === "application/pdf" ? 100 * 1024 * 1024 : isJson ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxLabel = file.type === "application/pdf" ? "100MB" : isJson ? "5MB" : "10MB";
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `ขนาดไฟล์ต้องไม่เกิน ${maxLabel}` },
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
