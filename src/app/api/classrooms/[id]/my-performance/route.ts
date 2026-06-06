import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Submission from "@/models/Submission";
import Quiz from "@/models/Quiz";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const classroom = await Classroom.findById(id);
    if (!classroom || !classroom.studentIds.map(s => s.toString()).includes(session.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const quizzes = await Quiz.find({ classroomId: id, published: true }).sort({ startAt: 1 });
    const submissions = await Submission.find({
      classroomId: id,
      studentId: session.userId,
    });

    const subMap = Object.fromEntries(submissions.map(s => [s.quizId.toString(), s]));

    // Performance over time
    const performanceOverTime = quizzes.map(quiz => {
      const sub = subMap[quiz._id.toString()];
      return {
        quizId: quiz._id,
        quizTitle: quiz.title,
        startAt: quiz.startAt,
        score: sub ? sub.score : null,
        totalMarks: sub ? sub.totalMarks : quiz.questions.reduce((sum, q) => sum + q.marks, 0),
        pct: sub && sub.totalMarks > 0 ? Math.round((sub.score / sub.totalMarks) * 100) : null,
      };
    }).filter(q => q.score !== null);

    // Topic accuracy
    const topicStats: Record<string, { correct: number; total: number }> = {};
    quizzes.forEach(quiz => {
      const sub = subMap[quiz._id.toString()];
      if (!sub) return;
      quiz.questions.forEach((q, idx) => {
        if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
        topicStats[q.topic].total++;
        if (sub.answers[idx]?.isCorrect) topicStats[q.topic].correct++;
      });
    });

    const topicAccuracy = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      correct: stats.correct,
      total: stats.total,
    })).sort((a, b) => b.accuracy - a.accuracy);

    const strongest = topicAccuracy.slice(0, 2);
    const weakest = topicAccuracy.slice(-2).reverse();

    return NextResponse.json({
      performance: {
        performanceOverTime,
        topicAccuracy,
        strongest,
        weakest,
      },
    });
  } catch (error) {
    console.error("My performance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
