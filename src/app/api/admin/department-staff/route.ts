import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

function dbKey(dept: string) {
  return `dept_staff_${dept}`;
}

export interface StaffMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number; // 1=ผู้จัดการ/หัวหน้า, 2=อาวุโส, 3=เจ้าหน้าที่
  order: number;
}

// GET /api/admin/department-staff?dept=managers
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dept = req.nextUrl.searchParams.get("dept");
  if (!dept) {
    return NextResponse.json({ error: "Missing dept param" }, { status: 400 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: dbKey(dept) },
    });

    const staff: StaffMember[] = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Failed to fetch department staff:", error);
    return NextResponse.json({ staff: [] }, { status: 500 });
  }
}

// PUT /api/admin/department-staff?dept=managers
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dept = req.nextUrl.searchParams.get("dept");
  if (!dept) {
    return NextResponse.json({ error: "Missing dept param" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { staff } = body as { staff: StaffMember[] };

    await prisma.siteSetting.upsert({
      where: { key: dbKey(dept) },
      create: {
        key: dbKey(dept),
        value: JSON.stringify(staff || []),
        remark: `บุคลากร: ${dept}`,
      },
      update: { value: JSON.stringify(staff || []) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save department staff:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
