import prisma from "@/lib/prisma";

const DB_KEY = "mourning_mode";

export type MourningModeData = {
  active: boolean;
  intensity: number;
  bannerText: string;
};

const DEFAULTS: MourningModeData = {
  active: false,
  intensity: 100,
  bannerText: "",
};

export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    let data: MourningModeData = DEFAULTS;
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        data = {
          active: Boolean(parsed.active),
          intensity: clampIntensity(parsed.intensity),
          bannerText: typeof parsed.bannerText === "string" ? parsed.bannerText : "",
        };
      } catch {
        data = DEFAULTS;
      }
    }

    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Failed to fetch mourning mode:", error);
    return Response.json(DEFAULTS, { status: 500 });
  }
}

function clampIntensity(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, Math.round(n)));
}
