/**
 * สร้างภาพปกจากหน้าแรกของไฟล์ PDF (ทำงานฝั่ง browser เท่านั้น)
 * ใช้ทั้งหน้า /annual-reports (กรณีรายงานไม่มีภาพปก) และหน้า admin (สร้างปกอัตโนมัติตอนอัปโหลด)
 */
import { loadPdfjs } from "./pdfjs";

export async function renderPdfFirstPage(
  src: string | ArrayBuffer,
  targetWidth = 640
): Promise<HTMLCanvasElement> {
  const pdfjsLib = await loadPdfjs();

  // โหลดเฉพาะส่วนที่ต้องใช้ (range request) — ไม่ดึงทั้งไฟล์เพื่อปกหน้าเดียว
  const task = pdfjsLib.getDocument(
    typeof src === "string"
      ? { url: src, disableAutoFetch: true, disableStream: true }
      : { data: src }
  );

  try {
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: targetWidth / base.width });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas;
  } finally {
    await task.destroy();
  }
}

const coverCache = new Map<string, Promise<string>>();
let renderChain: Promise<unknown> = Promise.resolve();

/** ปกจาก URL ของ PDF — ทำทีละไฟล์ต่อคิวกัน และจำผลไว้ตลอดการใช้งานหน้าเว็บ */
export function getPdfCoverDataUrl(url: string): Promise<string> {
  let cached = coverCache.get(url);
  if (!cached) {
    cached = renderChain
      .catch(() => {})
      .then(async () => {
        const canvas = await renderPdfFirstPage(url, 520);
        return canvas.toDataURL("image/jpeg", 0.85);
      });
    renderChain = cached;
    cached.catch(() => coverCache.delete(url));
    coverCache.set(url, cached);
  }
  return cached;
}

/** ปกเป็นไฟล์ JPEG พร้อมอัปโหลด */
export async function createPdfCoverFile(src: string | ArrayBuffer): Promise<File> {
  const canvas = await renderPdfFirstPage(src, 800);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.88)
  );
  if (!blob) throw new Error("Cannot create cover image");
  return new File([blob], "cover.jpg", { type: "image/jpeg" });
}
