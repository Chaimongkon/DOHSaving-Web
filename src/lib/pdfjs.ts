/**
 * โหลด pdf.js ฝั่ง browser พร้อม worker จาก package เดียวกัน
 * (ให้ bundler เป็นคนส่งไฟล์ worker — เวอร์ชันตรงกับไลบรารีเสมอ ไม่ต้องคัดลอกลง public/ เอง)
 */
export async function loadPdfjs() {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}
