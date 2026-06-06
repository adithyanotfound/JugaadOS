import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import QuestionBank from "@/models/QuestionBank";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");

    await dbConnect();

    const query: Record<string, unknown> = { teacherId: session.userId };
    if (subject) query.subject = { $regex: subject, $options: "i" };
    if (topic) query.topic = { $regex: topic, $options: "i" };

    const questions = await QuestionBank.find(query).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Get question bank error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
