/**
 * อัปโหลดไฟล์จากหน้า admin พร้อมแจ้งความคืบหน้า (fetch ยังรายงานความคืบหน้าการส่งไม่ได้ จึงใช้ XHR)
 * ใช้กับ /api/admin/upload — ได้ URL ของไฟล์กลับมา
 */
export function uploadAdminFile(file: File, folder: string, onProgress?: (ratio: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let json: { url?: string; error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* ตอบกลับไม่ใช่ JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.url) resolve(json.url);
      else reject(new Error(json.error || "อัปโหลดไม่สำเร็จ"));
    };
    xhr.onerror = () => reject(new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"));
    xhr.send(fd);
  });
}

export const MAX_PDF_BYTES = 100 * 1024 * 1024;

export const isPdfFile = (file: File) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

/** ชื่อไฟล์ภาษาไทยมักเป็นชื่อเอกสารอยู่แล้ว — ใช้ตั้งชื่อให้อัตโนมัติ (ชื่อไฟล์อังกฤษ/ตัวเลขไม่ใช้) */
export const titleFromFileName = (name: string) => {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return /[฀-๿]/.test(base) ? base : "";
};
