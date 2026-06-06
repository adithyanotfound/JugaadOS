import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Quiz, { IQuestion } from "@/models/Quiz";
import Submission from "@/models/Submission";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

function gradeAnswer(question: IQuestion, studentAnswer: unknown): { isCorrect: boolean; marksEarned: number } {
  const { type, correctAnswer, marks } = question;

  if (studentAnswer === null || studentAnswer === undefined || studentAnswer === "") {
    return { isCorrect: false, marksEarned: 0 };
  }

  switch (type) {
    case "mcq":
    case "truefalse": {
      const isCorrect = String(studentAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
      return { isCorrect, marksEarned: isCorrect ? marks : 0 };
    }
    case "msq": {
      const correct = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).map(s => s.toLowerCase().trim()).sort();
      const given = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]).map(s => s.toLowerCase().trim()).sort();
      const isCorrect = JSON.stringify(correct) === JSON.stringify(given);
      return { isCorrect, marksEarned: isCorrect ? marks : 0 };
    }
    case "fillblank": {
      const accepted = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).map(s => s.toLowerCase().trim());
      const isCorrect = accepted.includes(String(studentAnswer).toLowerCase().trim());
      return { isCorrect, marksEarned: isCorrect ? marks : 0 };
    }
    default:
      return { isCorrect: false, marksEarned: 0 };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;
    const body = await request.json();
    const { answers, timeTakenSec } = body;

    await dbConnect();

    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.published) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const now = new Date();
    if (now < quiz.startAt) {
      return NextResponse.json({ error: "Quiz has not started yet" }, { status: 400 });
    }
    if (now > quiz.endAt) {
      return NextResponse.json({ error: "Quiz attempt window has closed" }, { status: 400 });
    }

    const classroom = await Classroom.findById(quiz.classroomId);
    if (!classroom || !classroom.studentIds.map(s => s.toString()).includes(session.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check no existing submission
    const existing = await Submission.findOne({ quizId, studentId: session.userId });
    if (existing) {
      return NextResponse.json({ error: "You have already submitted this quiz" }, { status: 409 });
    }

    // Grade answers
    const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
    let score = 0;

    const gradedAnswers = quiz.questions.map((question) => {
      const studentAnswer = answers?.[question._id?.toString() ?? ""];
      const { isCorrect, marksEarned } = gradeAnswer(question, studentAnswer);
      score += marksEarned;
      return {
        questionId: question._id,
        answer: studentAnswer ?? null,
        isCorrect,
        marksEarned,
      };
    });

    const submission = await Submission.create({
      quizId,
      studentId: session.userId,
      classroomId: quiz.classroomId,
      answers: gradedAnswers,
      score,
      totalMarks,
      timeTakenSec: timeTakenSec ?? 0,
      submittedAt: now,
    });

    // Topic breakdown
    const topicBreakdown: Record<string, { earned: number; total: number }> = {};
    quiz.questions.forEach((q, idx) => {
      const { isCorrect, marksEarned } = gradedAnswers[idx];
      void isCorrect;
      if (!topicBreakdown[q.topic]) {
        topicBreakdown[q.topic] = { earned: 0, total: 0 };
      }
      topicBreakdown[q.topic].earned += marksEarned;
      topicBreakdown[q.topic].total += q.marks;
    });

    return NextResponse.json({
      submission: {
        id: submission._id,
        score,
        totalMarks,
        timeTakenSec: submission.timeTakenSec,
        topicBreakdown,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
