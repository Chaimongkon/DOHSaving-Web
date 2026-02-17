// Mock data matching Prisma `Slide` model
// When backend is ready, replace with API call: fetch("/api/slides")

export interface SlideData {
  id: number;
  sortOrder: number;
  imagePath: string | null;
  urlLink: string | null;
  isActive: boolean;
  // Frontend-only fields (for display before we have real images)
  title: string;
  subtitle: string;
  description: string;
  bgGradient: string;
  ctaText: string;
}

export const mockSlides: SlideData[] = [
  {
    id: 1,
    sortOrder: 1,
    imagePath: "https://picsum.photos/id/1076/1400/500", // อาคารสำนักงาน
    urlLink: "/services/member-type-a",
    isActive: true,
    title: "สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด",
    subtitle: "DOH Saving & Credit Cooperative, Ltd.",
    description:
      "บริการเงินฝาก สินเชื่อ และสวัสดิการสมาชิก ด้วยระบบที่ทันสมัย โปร่งใส เพื่อคุณภาพชีวิตที่ดีของสมาชิก",
    bgGradient:
      "linear-gradient(135deg, rgba(15,29,54,0.85) 0%, rgba(26,58,92,0.75) 40%, rgba(232,101,43,0.6) 100%)",
    ctaText: "สมัครสมาชิก",
  },
  {
    id: 2,
    sortOrder: 2,
    imagePath: "https://picsum.photos/id/366/1400/500", // ธรรมชาติ เงียบสงบ
    urlLink: "/interest-rates",
    isActive: true,
    title: "อัตราดอกเบี้ยเงินฝาก",
    subtitle: "ฝากง่าย ผลตอบแทนดี มั่นคง",
    description:
      "เงินฝากออมทรัพย์ เงินฝากประจำ และเงินฝากออมทรัพย์พิเศษ ดอกเบี้ยสูง สมาชิกมั่นใจได้",
    bgGradient:
      "linear-gradient(135deg, rgba(26,58,92,0.85) 0%, rgba(15,29,54,0.8) 50%, rgba(45,24,16,0.7) 100%)",
    ctaText: "ดูอัตราดอกเบี้ย",
  },
  {
    id: 3,
    sortOrder: 3,
    imagePath: "https://picsum.photos/id/260/1400/500", // เมือง ทันสมัย
    urlLink: "/services/general-loan",
    isActive: true,
    title: "สินเชื่อเพื่อสมาชิก",
    subtitle: "เงินกู้ดอกเบี้ยต่ำ อนุมัติรวดเร็ว",
    description:
      "เงินกู้ฉุกเฉิน เงินกู้สามัญ และเงินกู้พิเศษ เพื่อตอบสนองทุกความต้องการของสมาชิก",
    bgGradient:
      "linear-gradient(135deg, rgba(45,24,16,0.85) 0%, rgba(232,101,43,0.7) 40%, rgba(26,58,92,0.8) 100%)",
    ctaText: "ดูบริการเงินกู้",
  },
  {
    id: 4,
    sortOrder: 4,
    imagePath: "https://picsum.photos/id/399/1400/500", // ครอบครัว ชีวิต
    urlLink: "/services/welfare-a",
    isActive: true,
    title: "สวัสดิการสมาชิก",
    subtitle: "ดูแลสมาชิกทุกช่วงชีวิต",
    description:
      "สวัสดิการครบวงจร ทั้งสมาชิกสามัญ ประเภท ก ประเภท ข และสมาชิกสมทบ",
    bgGradient:
      "linear-gradient(135deg, rgba(15,29,54,0.85) 0%, rgba(30,58,47,0.75) 50%, rgba(232,101,43,0.6) 100%)",
    ctaText: "ดูสวัสดิการ",
  },
];
