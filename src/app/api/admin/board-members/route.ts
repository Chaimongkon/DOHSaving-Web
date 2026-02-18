import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_board_members";

export interface BoardMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number; // 1=ประธาน, 2=รอง, 3=เหรัญญิก/เลขา, 4=กรรมการ
  order: number;
}

// GET /api/admin/board-members
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const members: BoardMember[] = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to fetch board members:", error);
    return NextResponse.json({ members: [] }, { status: 500 });
  }
}

// POST /api/admin/board-members — เพิ่มสมาชิกใหม่
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const newMember: BoardMember = body.member;

    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const members: BoardMember[] = setting?.value ? JSON.parse(setting.value) : [];
    members.push(newMember);

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(members),
        remark: "คณะกรรมการดำเนินการ",
      },
      update: { value: JSON.stringify(members) },
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error("Failed to add board member:", error);
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}

// PUT /api/admin/board-members — บันทึกทั้งหมด (bulk save)
export async function PUT(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { members } = body as { members: BoardMember[] };

    await prisma.siteSetting.upsert({
      where: { key: DB_KEY },
      create: {
        key: DB_KEY,
        value: JSON.stringify(members || []),
        remark: "คณะกรรมการดำเนินการ",
      },
      update: { value: JSON.stringify(members || []) },
    });

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Failed to save board members:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
