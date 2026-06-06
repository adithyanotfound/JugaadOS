import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Quiz from "@/models/Quiz";
import Submission from "@/models/Submission";
import Classroom from "@/models/Classroom";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    await dbConnect();

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const classroom = await Classroom.findOne({ _id: quiz.classroomId, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const submissions = await Submission.find({ quizId }).sort({ submittedAt: -1 });

    // Populate student info
    const studentIds = submissions.map(s => s.studentId);
    const students = await User.find({ _id: { $in: studentIds } }, { fullName: 1, grade: 1, username: 1 });
    const studentMap = Object.fromEntries(students.map(s => [s._id.toString(), s]));

    const enriched = submissions.map(sub => ({
      ...sub.toObject(),
      student: studentMap[sub.studentId.toString()],
      questions: quiz.questions,
    }));

    return NextResponse.json({ submissions: enriched, quiz });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
