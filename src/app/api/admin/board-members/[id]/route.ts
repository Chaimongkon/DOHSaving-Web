import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

const DB_KEY = "page_board_members";

interface BoardMember {
  id: string;
  name: string;
  position: string;
  imageUrl: string;
  tier: number;
  order: number;
}

// DELETE /api/admin/board-members/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const setting = await prisma.siteSetting.findUnique({
      where: { key: DB_KEY },
    });

    const members: BoardMember[] = setting?.value ? JSON.parse(setting.value) : [];
    const filtered = members.filter((m) => m.id !== id);

    await prisma.siteSetting.update({
      where: { key: DB_KEY },
      data: { value: JSON.stringify(filtered) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete board member:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
