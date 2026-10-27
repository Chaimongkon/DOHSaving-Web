// สร้างโดย scripts/festival-images.mjs — ห้ามแก้เอง
// เทศกาลที่มีภาพจริงจากฝ่ายประชาสัมพันธ์แล้ว (public/festival/<key>/*.webp)
// colors: [เข้ม (เงาส่วนท้าย), เน้น (ทอง), อ่อน (พื้นหน้าเว็บ)] จากไฟล์ .txt ในโฟลเดอร์ design ของเทศกาล
// missing: ส่วนที่ยังไม่มีภาพจริง (sky / seam / edge-left / footer-scene) — ใช้ภาพวาดเดิมแทน
export const REAL_ART: Record<string, { character: boolean; icons: boolean; missing?: string[]; colors?: [string, string, string] }> = {
  "agm": { character: false, icons: false, colors: ["#0F1D36","#D8AE3F","#3B82C4"] },
  "christmas": { character: true, icons: false },
  "halloween": { character: true, icons: false, colors: ["#24134A","#F59E0B","#A855F7"] },
  "loy-krathong": { character: true, icons: true, colors: ["#0B1A3A","#E0B44A","#F2A7C3"] },
  "makha-bucha": { character: false, icons: false },
  "newyear": { character: true, icons: false, colors: ["#151A3D","#E8B923","#F472B6"] },
  "savings": { character: true, icons: false, colors: ["#123A66","#E0B44A","#4CAF50"] },
  "songkran": { character: true, icons: false, colors: ["#0A3D7A","#22C3E6","#F472B6"] },
  "valentine": { character: true, icons: false, colors: ["#4A1838","#E11D48","#F472B6"] },
};
