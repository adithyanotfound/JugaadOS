import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Submission from "@/models/Submission";
import Quiz from "@/models/Quiz";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    await dbConnect();

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const classroom = await Classroom.findById(quiz.classroomId);
    if (!classroom || !classroom.studentIds.map(s => s.toString()).includes(session.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const submission = await Submission.findOne({ quizId, studentId: session.userId });
    if (!submission) return NextResponse.json({ submission: null, quiz });

    return NextResponse.json({ submission, quiz });
  } catch (error) {
    console.error("Get my submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
