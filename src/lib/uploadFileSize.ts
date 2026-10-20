import { stat } from "fs/promises";
import path from "path";

/** ขนาดไฟล์ (ไบต์) ของไฟล์ที่อัปโหลดไว้ในเครื่อง — ให้ผู้ใช้เห็นก่อนกดดาวน์โหลด (server เท่านั้น) */
export async function getUploadFileSize(fileUrl: string | null | undefined): Promise<number | null> {
  if (!fileUrl || !fileUrl.startsWith("/uploads/") || fileUrl.includes("..")) return null;
  try {
    const fileStat = await stat(path.join(process.cwd(), "public", decodeURIComponent(fileUrl)));
    return fileStat.isFile() ? fileStat.size : null;
  } catch {
    return null;
  }
}
