// Mock data matching Prisma `News` model
// When backend is ready, replace with API call: fetch("/api/news")

export interface NewsData {
  id: number;
  title: string | null;
  details: string | null;
  imagePath: string | null;
  pdfPath: string | null;
  isActive: boolean;
  isPinned?: boolean;
  createdAt: string;
  category: string;
  viewCount: number;
}

// Category labels + colors for display
export const categoryMap: Record<string, { label: string; color: string }> = {
  announcement: { label: "ประกาศ", color: "#E8652B" },
  "member-approval": { label: "อนุมัติสมาชิก", color: "#2d6a4f" },
  general: { label: "ทั่วไป", color: "#1a3a5c" },
};

export const mockNews: NewsData[] = [
  {
    id: 1,
    title: "อนุมัติสมัครสมาชิกใหม่ประเภท สามัญ ก",
    details:
      "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด อนุมัติรับสมาชิกใหม่ประเภทสามัญ ก ประจำเดือนมกราคม 2569",
    imagePath: "https://picsum.photos/id/1025/600/400",
    pdfPath: null,
    isActive: true,
    createdAt: "2026-01-15T09:00:00Z",
    category: "member-approval",
    viewCount: 342,
  },
  {
    id: 2,
    title: "อนุมัติสมัครสมาชิกใหม่ประเภท สามัญ ข",
    details:
      "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด อนุมัติรับสมาชิกใหม่ประเภทสามัญ ข ประจำเดือนมกราคม 2569",
    imagePath: "https://picsum.photos/id/1074/600/400",
    pdfPath: null,
    isActive: true,
    createdAt: "2026-01-14T09:00:00Z",
    category: "member-approval",
    viewCount: 289,
  },
  {
    id: 3,
    title: "อนุมัติสมัครสมาชิกใหม่ประเภท สมทบ",
    details:
      "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด อนุมัติรับสมาชิกใหม่ประเภทสมทบ ประจำเดือนมกราคม 2569",
    imagePath: "https://picsum.photos/id/1012/600/400",
    pdfPath: null,
    isActive: true,
    createdAt: "2026-01-13T09:00:00Z",
    category: "member-approval",
    viewCount: 256,
  },
  {
    id: 4,
    title: "ประกาศอัตราดอกเบี้ยเงินฝากใหม่ มีผลตั้งแต่ 1 มกราคม 2569",
    details:
      "สหกรณ์ฯ ประกาศปรับอัตราดอกเบี้ยเงินฝากใหม่ เพื่อประโยชน์สูงสุดของสมาชิก",
    imagePath: "https://picsum.photos/id/1076/600/400",
    pdfPath: null,
    isActive: true,
    createdAt: "2026-01-10T09:00:00Z",
    category: "announcement",
    viewCount: 1024,
  },
  {
    id: 5,
    title: "แจ้งกำหนดการประชุมใหญ่สามัญประจำปี 2568",
    details:
      "สหกรณ์ฯ กำหนดจัดประชุมใหญ่สามัญประจำปี 2568 ในวันเสาร์ที่ 15 มีนาคม 2569 ณ ห้องประชุมกรมทางหลวง",
    imagePath: "https://picsum.photos/id/366/600/400",
    pdfPath: null,
    isActive: true,
    createdAt: "2026-01-05T09:00:00Z",
    category: "announcement",
    viewCount: 587,
  },
  {
    id: 6,
    title: "ประกาศผลการเลือกตั้งคณะกรรมการดำเนินการ ชุดที่ 48",
    details:
      "ตามที่สหกรณ์ฯ ได้จัดให้มีการเลือกตั้งคณะกรรมการดำเนินการ ชุดที่ 48 บัดนี้การเลือกตั้งเสร็จสิ้นแล้ว",
    imagePath: "https://picsum.photos/id/433/600/400",
    pdfPath: null,
    isActive: true,
    createdAt: "2025-12-01T09:00:00Z",
    category: "general",
    viewCount: 412,
  },
];
