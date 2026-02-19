import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/contact — fetch all contact data for admin
export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [info, departments, lineContacts] = await Promise.all([
      prisma.contactInfo.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.lineContact.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    return NextResponse.json({ info, departments, lineContacts });
  } catch (error) {
    console.error("Admin contact fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/contact — upsert contact info key-value
export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
    }

    const result = await prisma.contactInfo.upsert({
      where: { key },
      update: { value, updatedBy: user.userName },
      create: { key, value, updatedBy: user.userName },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin contact upsert error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
