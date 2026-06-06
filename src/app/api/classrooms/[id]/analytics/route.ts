import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Classroom from "@/models/Classroom";
import Quiz, { IQuestion } from "@/models/Quiz";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const classroom = await Classroom.findOne({ _id: id, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const students = await User.find(
      { _id: { $in: classroom.studentIds } },
      { fullName: 1, grade: 1, username: 1 }
    );
    const studentMap = Object.fromEntries(students.map(s => [s._id.toString(), s]));

    const quizzes = await Quiz.find({ classroomId: id, published: true }).sort({ createdAt: 1 });
    const submissions = await Submission.find({ classroomId: id });

    const totalStudents = classroom.studentIds.length;

    // --- Quiz Completion Rate ---
    const completionRates = quizzes.map(quiz => {
      const quizSubs = submissions.filter(s => s.quizId.toString() === quiz._id.toString());
      return {
        quizId: quiz._id,
        quizTitle: quiz.title,
        submitted: quizSubs.length,
        total: totalStudents,
        rate: totalStudents > 0 ? (quizSubs.length / totalStudents) * 100 : 0,
      };
    });

    // --- Score Distribution ---
    const scoreDistribution = quizzes.map(quiz => {
      const quizSubs = submissions.filter(s => s.quizId.toString() === quiz._id.toString());
      const buckets = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
      quizSubs.forEach(sub => {
        const pct = sub.totalMarks > 0 ? (sub.score / sub.totalMarks) * 100 : 0;
        if (pct <= 25) buckets["0-25"]++;
        else if (pct <= 50) buckets["26-50"]++;
        else if (pct <= 75) buckets["51-75"]++;
        else buckets["76-100"]++;
      });
      return { quizId: quiz._id, quizTitle: quiz.title, buckets };
    });

    // --- Per-Student Score Table ---
    const perStudentScores = students.map(student => {
      const sid = student._id.toString();
      const quizScores = quizzes.map(quiz => {
        const sub = submissions.find(
          s => s.quizId.toString() === quiz._id.toString() && s.studentId.toString() === sid
        );
        if (!sub) return { quizId: quiz._id, quizTitle: quiz.title, pct: null };
        const pct = sub.totalMarks > 0 ? (sub.score / sub.totalMarks) * 100 : 0;
        return { quizId: quiz._id, quizTitle: quiz.title, pct: Math.round(pct) };
      });
      const attempted = quizScores.filter(q => q.pct !== null);
      const avg = attempted.length > 0 ? attempted.reduce((sum, q) => sum + (q.pct ?? 0), 0) / attempted.length : null;
      return {
        studentId: sid,
        fullName: student.fullName,
        grade: student.grade,
        quizScores,
        avg: avg !== null ? Math.round(avg) : null,
      };
    });

    // --- Topic Weakness Heatmap ---
    const allTopics = new Set<string>();
    quizzes.forEach(quiz => quiz.questions.forEach((q: IQuestion) => allTopics.add(q.topic)));
    const topics = Array.from(allTopics);

    const topicHeatmap = students.map(student => {
      const sid = student._id.toString();
      const studentSubs = submissions.filter(s => s.studentId.toString() === sid);

      const topicAccuracy: Record<string, { correct: number; total: number } | null> = {};
      topics.forEach(topic => {
        let correct = 0, total = 0;
        quizzes.forEach(quiz => {
          const sub = studentSubs.find(s => s.quizId.toString() === quiz._id.toString());
          if (!sub) return;
          quiz.questions.forEach((q: IQuestion, idx: number) => {
            if (q.topic === topic) {
              total++;
              if (sub.answers[idx]?.isCorrect) correct++;
            }
          });
        });
        topicAccuracy[topic] = total > 0 ? { correct, total } : null;
      });

      return {
        studentId: sid,
        fullName: student.fullName,
        topicAccuracy,
      };
    });

    // --- Question Difficulty Stats ---
    const questionDifficulty = quizzes.map(quiz => {
      const quizSubs = submissions.filter(s => s.quizId.toString() === quiz._id.toString());
      const stats = quiz.questions.map((q: IQuestion, idx: number) => {
        const incorrect = quizSubs.filter(sub => !sub.answers[idx]?.isCorrect).length;
        const total = quizSubs.length;
        return {
          questionId: q._id,
          stem: q.stem.substring(0, 80),
          topic: q.topic,
          incorrectPct: total > 0 ? Math.round((incorrect / total) * 100) : 0,
          total,
        };
      }).sort((a: { incorrectPct: number }, b: { incorrectPct: number }) => b.incorrectPct - a.incorrectPct);

      return { quizId: quiz._id, quizTitle: quiz.title, stats };
    });

    return NextResponse.json({
      analytics: {
        completionRates,
        scoreDistribution,
        perStudentScores,
        topics,
        topicHeatmap,
        questionDifficulty,
        students: students.map(s => ({ _id: s._id, fullName: s.fullName, grade: s.grade })),
        quizzes: quizzes.map(q => ({ _id: q._id, title: q.title })),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
