import { NextRequest } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
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

/** แปลง header Range (เฉพาะช่วงเดียว) → [start, end] หรือ null ถ้าไม่ถูกต้อง */
function parseRange(header: string, size: number): [number, number] | null {
    const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
    if (!match || (match[1] === "" && match[2] === "")) return null;

    let start: number;
    let end: number;
    if (match[1] === "") {
        // bytes=-N → N ไบต์สุดท้าย
        start = Math.max(0, size - Number(match[2]));
        end = size - 1;
    } else {
        start = Number(match[1]);
        end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
    }
    return start > end || start >= size ? null : [start, end];
}

function fileStream(filePath: string, start?: number, end?: number) {
    return Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
}

// GET /uploads/[...path] — serve dynamically uploaded files
// ส่งแบบ stream และรองรับ Range request — ไฟล์ PDF ขนาดใหญ่ (eBook รายงานประจำปี)
// จึงเปิดอ่านหน้าไหนก็ได้ทันที ไม่ต้องรอดาวน์โหลดทั้งไฟล์
export async function GET(
    req: NextRequest,
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

        const size = fileStat.size;
        const ext = path.extname(filePath).toLowerCase();
        const headers: Record<string, string> = {
            "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
            "Accept-Ranges": "bytes",
            "Last-Modified": fileStat.mtime.toUTCString(),
            "Cache-Control": "public, max-age=31536000, immutable",
        };

        const rangeHeader = req.headers.get("range");
        if (rangeHeader) {
            const range = parseRange(rangeHeader, size);
            if (!range) {
                return new Response(null, {
                    status: 416,
                    headers: { ...headers, "Content-Range": `bytes */${size}` },
                });
            }
            const [start, end] = range;
            return new Response(fileStream(filePath, start, end), {
                status: 206,
                headers: {
                    ...headers,
                    "Content-Range": `bytes ${start}-${end}/${size}`,
                    "Content-Length": String(end - start + 1),
                },
            });
        }

        return new Response(fileStream(filePath), {
            headers: { ...headers, "Content-Length": String(size) },
        });
    } catch {
        return new Response("Not found", { status: 404 });
    }
}
