import { NextRequest } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".json": "application/json",
    ".ico": "image/x-icon",
};

// GET /uploads/[...path] — serve dynamically uploaded files
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: segments } = await params;
    const relativePath = segments.join("/");

    // Prevent path traversal
    if (relativePath.includes("..")) {
        return new Response("Forbidden", { status: 403 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", relativePath);

    try {
        const fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
            return new Response("Not found", { status: 404 });
        }

        const buffer = await readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new Response(buffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(buffer.length),
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return new Response("Not found", { status: 404 });
    }
}
