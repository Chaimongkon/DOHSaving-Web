import type { NextRequest } from "next/server";
import { EMPTY_DOC_META } from "@/lib/docMeta";
import { readGovernanceDoc } from "@/lib/governanceDoc";

const DB_KEY = "page_ethics_staff_items";

// GET /api/ethics-staff-items — public
export async function GET(_req: NextRequest) {
  try {
    const { items, meta } = await readGovernanceDoc(DB_KEY);

    return Response.json(
      { items, meta },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch ethics-staff items:", error);
    return Response.json({ items: [], meta: EMPTY_DOC_META }, { status: 500 });
  }
}
