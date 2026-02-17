// Mock data matching Prisma `Video` model
// When backend is ready, replace with API call: fetch("/api/videos")

export interface VideoData {
  id: number;
  title: string;
  youtubeUrl: string;
  details: string;
  category: string;
  isActive: boolean;
}

export const mockVideos: VideoData[] = [
  {
    id: 1,
    title: "กู้สามัญ ทันต์ใจ",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    details: "แนะนำบริการเงินกู้สามัญ สะดวก รวดเร็ว",
    category: "general",
    isActive: true,
  },
  {
    id: 2,
    title: "สิทธิพิเศษ สำหรับ สมาชิก",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    details: "สิทธิประโยชน์มากมายสำหรับสมาชิกสหกรณ์",
    category: "general",
    isActive: true,
  },
  {
    id: 3,
    title: "กู้สามัญ บัณฑิตกรมทางหลวง",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    details: "เงินกู้สามัญสำหรับบัณฑิตกรมทางหลวง",
    category: "general",
    isActive: true,
  },
  {
    id: 4,
    title: "ฝาก-ถอน-กู้ ผ่าน DOH Saving APP",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    details: "วิธีการใช้งานแอปพลิเคชัน DOH Saving",
    category: "general",
    isActive: true,
  },
  {
    id: 5,
    title: "กู้สหกรณ์ ทำไมถึงต้องเลือกเรา",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    details: "เหตุผลที่สมาชิกเลือกใช้บริการสหกรณ์",
    category: "general",
    isActive: true,
  },
];
