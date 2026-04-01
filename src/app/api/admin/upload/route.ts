import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdminRouteAccess } from "@/lib/adminAuth";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "general";
    const folder =
      rawFolder.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50) || "general";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const isImage =
      IMAGE_EXTENSIONS.has(ext) && IMAGE_MIME_TYPES.has(file.type);
    const isPdf = ext === ".pdf" && file.type === "application/pdf";
    const isLottie =
      folder === "lottie" &&
      ext === ".json" &&
      ["application/json", "text/plain", ""].includes(file.type);

    if (!isImage && !isPdf && !isLottie) {
      return NextResponse.json(
        {
          error:
            "Only jpg, jpeg, png, webp, gif, pdf, and lottie json uploads are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = isPdf
      ? 100 * 1024 * 1024
      : isLottie
        ? 5 * 1024 * 1024
        : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must not exceed ${Math.floor(maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${folder}/${fileName}`,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}