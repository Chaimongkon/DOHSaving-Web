import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = await authenticateRequest(req);

  if (!payload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new Response(null, { status: 204 });
}
