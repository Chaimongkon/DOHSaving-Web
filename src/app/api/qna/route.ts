import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/qna — list questions (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all | answered | unanswered
    const sort = searchParams.get("sort") || "latest"; // latest | popular
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (search) where.title = { contains: search };
    if (filter === "answered") where.replies = { some: { isActive: true } };
    if (filter === "unanswered") where.replies = { none: { isActive: true } };

    const orderBy =
      sort === "popular"
        ? [{ isPinned: "desc" as const }, { views: "desc" as const }]
        : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

    const [questions, total, totalAll, totalAnswered] = await Promise.all([
      prisma.qnaQuestion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          authorName: true,
          title: true,
          views: true,
          isPinned: true,
          isClosed: true,
          createdAt: true,
          _count: { select: { replies: { where: { isActive: true } } } },
          replies: {
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              authorName: true,
              body: true,
              isAdmin: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.qnaQuestion.count({ where }),
      prisma.qnaQuestion.count({ where: { isActive: true } }),
      prisma.qnaQuestion.count({
        where: { isActive: true, replies: { some: { isActive: true } } },
      }),
    ]);

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        replyCount: q._count.replies,
        latestReply: q.replies[0] || null,
        replies: undefined,
        _count: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: totalAll,
        answered: totalAnswered,
        unanswered: totalAll - totalAnswered,
      },
    });
  } catch (error) {
    console.error("Failed to get QnA:", error);
    return NextResponse.json({ questions: [], total: 0 }, { status: 500 });
  }
}

// POST /api/qna — create new question (public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authorName, memberCode, title, body: questionBody } = body;

    if (!title || !questionBody) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อและเนื้อหา" }, { status: 400 });
    }

    const question = await prisma.qnaQuestion.create({
      data: {
        authorName: authorName?.trim() || "ผู้ไม่ประสงค์ออกนาม",
        memberCode: memberCode?.trim() || "000000",
        title: title.trim(),
        body: questionBody.trim(),
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
