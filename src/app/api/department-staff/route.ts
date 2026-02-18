import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function dbKey(dept: string) {
  return `dept_staff_${dept}`;
}

// GET /api/department-staff?dept=managers — public
export async function GET(req: NextRequest) {
  const dept = req.nextUrl.searchParams.get("dept");
  if (!dept) {
    return NextResponse.json({ error: "Missing dept param" }, { status: 400 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: dbKey(dept) },
    });

    const staff = setting?.value ? JSON.parse(setting.value) : [];

    return NextResponse.json(
      { staff },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch department staff:", error);
    return NextResponse.json({ staff: [] }, { status: 500 });
  }
}
