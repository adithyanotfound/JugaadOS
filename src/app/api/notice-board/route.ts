import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import NoticeBoard from "@/models/NoticeBoard";
import { getSession } from "@/lib/auth";

const CreateSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1).max(3000),
  category: z.enum(["club", "academic", "general", "event"]).default("general"),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const notices = await NoticeBoard.find({}).sort({ isPinned: -1, createdAt: -1 }).limit(100);
    return NextResponse.json({ notices });
  } catch (error) {
    console.error("Get notice-board error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const notice = await NoticeBoard.create({
      ...parsed.data,
      postedBy: session.userId,
      postedByName: session.fullName,
      postedByRole: session.role,
    });

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error("Create notice-board error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
