import prisma from "@/lib/prisma";
import { MOURNING_KEY, isMourningLive, parseMourning } from "@/lib/mourningMode";

export type MourningModeData = {
  active: boolean;
  intensity: number;
  bannerText: string;
};

const OFF: MourningModeData = { active: false, intensity: 100, bannerText: "" };

// GET /api/mourning-mode — public: active = แสดงอยู่จริงตอนนี้ (เลยวันปิดอัตโนมัติแล้ว = ปิด)
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: MOURNING_KEY } });
    const s = parseMourning(setting?.value);
    const data: MourningModeData = { active: isMourningLive(s), intensity: s.intensity, bannerText: s.bannerText };

    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Failed to fetch mourning mode:", error);
    return Response.json(OFF, { status: 500 });
  }
}
