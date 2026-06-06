import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Quiz from "@/models/Quiz";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

const CreateQuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  timeLimitMin: z.number().min(1, "Time limit must be at least 1 minute").max(300),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
}).refine(d => new Date(d.endAt) > new Date(d.startAt), {
  message: "End time must be after start time",
  path: ["endAt"],
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const classroom = await Classroom.findById(id);
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const isTeacher = session.role === "teacher" && classroom.teacherId.toString() === session.userId;
    const isStudent = session.role === "student" && classroom.studentIds.map(s => s.toString()).includes(session.userId);
    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let query: Record<string, unknown> = { classroomId: id };
    // Students only see published quizzes
    if (session.role === "student") {
      query.published = true;
    }

    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });

    // Strip question answers for students (before window closes)
    if (session.role === "student") {
      const now = new Date();
      const sanitized = quizzes.map(q => {
        const qObj = q.toObject();
        const windowClosed = now > new Date(qObj.endAt);
        if (!windowClosed) {
          qObj.questions = qObj.questions.map((question: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { correctAnswer, ...rest } = question;
            void correctAnswer;
            return rest;
          });
        }
        return qObj;
      });
      return NextResponse.json({ quizzes: sanitized });
    }

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("Get quizzes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = CreateQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const classroom = await Classroom.findOne({ _id: id, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const quiz = await Quiz.create({
      classroomId: id,
      title: parsed.data.title,
      description: parsed.data.description,
      timeLimitMin: parsed.data.timeLimitMin,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      questions: [],
      published: false,
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
