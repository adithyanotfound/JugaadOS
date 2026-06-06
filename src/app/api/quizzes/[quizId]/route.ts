import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Quiz from "@/models/Quiz";
import Classroom from "@/models/Classroom";
import QuestionBank from "@/models/QuestionBank";
import { getSession } from "@/lib/auth";

const QuestionSchema = z.object({
  type: z.enum(["mcq", "msq", "truefalse", "fillblank"]),
  stem: z.string().min(1, "Question stem is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  marks: z.number().min(1),
  topic: z.string().min(1, "Topic is required"),
  order: z.number(),
});

const UpdateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  timeLimitMin: z.number().min(1).max(300).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  questions: z.array(QuestionSchema).optional(),
  published: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quizId } = await params;
    await dbConnect();

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const classroom = await Classroom.findById(quiz.classroomId);
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const isTeacher = session.role === "teacher" && classroom.teacherId.toString() === session.userId;
    const isStudent = session.role === "student" && classroom.studentIds.map(s => s.toString()).includes(session.userId);
    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Get quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const body = await request.json();
    const parsed = UpdateQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const classroom = await Classroom.findOne({ _id: quiz.classroomId, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const updateData = parsed.data;
    if (updateData.startAt) updateData.startAt = new Date(updateData.startAt) as unknown as string;
    if (updateData.endAt) updateData.endAt = new Date(updateData.endAt) as unknown as string;

    const updatedQuiz = await Quiz.findByIdAndUpdate(quizId, updateData, { new: true });

    // Save questions to question bank
    if (parsed.data.questions && parsed.data.questions.length > 0) {
      const bankDocs = parsed.data.questions.map(q => ({
        teacherId: session.userId,
        question: q,
        subject: classroom.subject,
        topic: q.topic,
      }));

      for (const doc of bankDocs) {
        await QuestionBank.create(doc).catch(() => {}); // Ignore duplicates
      }
    }

    return NextResponse.json({ quiz: updatedQuiz });
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    await Quiz.findByIdAndDelete(quizId);
    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
