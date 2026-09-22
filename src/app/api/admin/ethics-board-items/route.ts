import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { EMPTY_DOC_META } from "@/lib/docMeta";
import { readGovernanceDoc, writeGovernanceDoc } from "@/lib/governanceDoc";

const DB_KEY = "page_ethics_board_items";
const REMARK = "จรรยาบรรณคณะกรรมการ";

export interface EthicsBoardItem {
  id: string;
  text: string;
}

// GET /api/admin/ethics-board-items
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { items, meta } = await readGovernanceDoc(DB_KEY);
    return NextResponse.json({ items, meta });
  } catch (error) {
    console.error("Failed to fetch ethics-board items:", error);
    return NextResponse.json({ items: [], meta: EMPTY_DOC_META }, { status: 500 });
  }
}

// PUT /api/admin/ethics-board-items
export async function PUT(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await req.json();
    const { items, meta } = body as { items: EthicsBoardItem[]; meta?: unknown };

    const saved = await writeGovernanceDoc(DB_KEY, items, meta, REMARK);
    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    console.error("Failed to save ethics-board items:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
