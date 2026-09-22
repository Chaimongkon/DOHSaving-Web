import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/adminAuth";
import { EMPTY_DOC_META } from "@/lib/docMeta";
import { readGovernanceDoc, writeGovernanceDoc } from "@/lib/governanceDoc";

const DB_KEY = "page_ethics_staff_items";
const REMARK = "จรรยาบรรณเจ้าหน้าที่";

export interface EthicsStaffItem {
  id: string;
  text: string;
}

// GET /api/admin/ethics-staff-items
export async function GET(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { items, meta } = await readGovernanceDoc(DB_KEY);
    return NextResponse.json({ items, meta });
  } catch (error) {
    console.error("Failed to fetch ethics-staff items:", error);
    return NextResponse.json({ items: [], meta: EMPTY_DOC_META }, { status: 500 });
  }
}

// PUT /api/admin/ethics-staff-items
export async function PUT(req: NextRequest) {
  const user = await requireAdminRouteAccess(req);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await req.json();
    const { items, meta } = body as { items: EthicsStaffItem[]; meta?: unknown };

    const saved = await writeGovernanceDoc(DB_KEY, items, meta, REMARK);
    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    console.error("Failed to save ethics-staff items:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
