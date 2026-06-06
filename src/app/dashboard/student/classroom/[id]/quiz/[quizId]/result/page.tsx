"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Submission {
  score: number;
  totalMarks: number;
  timeTakenSec: number;
  submittedAt: string;
  answers: Array<{ questionId: string; isCorrect: boolean; marksEarned: number }>;
}

interface Quiz {
  title: string;
  questions: Array<{ _id: string; topic: string; marks: number }>;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.id as string;
  const quizId = params.quizId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/my-submission`);
      const data = await res.json();
      if (res.ok) {
        setSubmission(data.submission);
        setQuiz(data.quiz);
      }
    } catch {
      toast.error("Failed to load result");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { fetchResult(); }, [fetchResult]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  if (!submission || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No submission found</p>
      </div>
    );
  }

  const pct = submission.totalMarks > 0 ? Math.round((submission.score / submission.totalMarks) * 100) : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  // Topic breakdown
  const topicBreakdown: Record<string, { earned: number; total: number }> = {};
  quiz.questions.forEach((q, idx) => {
    const ans = submission.answers[idx];
    if (!topicBreakdown[q.topic]) topicBreakdown[q.topic] = { earned: 0, total: 0 };
    topicBreakdown[q.topic].earned += ans?.marksEarned || 0;
    topicBreakdown[q.topic].total += q.marks;
  });

  const scoreColor = pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626";
  const scoreLabel = pct >= 75 ? "Excellent" : pct >= 50 ? "Good effort" : "Keep practising";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4" style={{ borderColor: scoreColor }}>
            <span className="font-bold text-lg" style={{ color: scoreColor }}>{pct}%</span>
          </div>
          <h1 className="text-xl font-bold text-black mb-1">{quiz.title}</h1>
          <p className="text-sm mb-1" style={{ color: scoreColor }}>{scoreLabel}</p>
          <p className="text-gray-400 text-xs mb-6">Quiz Result</p>

          <div className="mb-6">
            <p className="text-5xl font-bold mb-1" style={{ color: scoreColor }}>
              {submission.score}
              <span className="text-2xl text-gray-400">/{submission.totalMarks}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="text-center">
              <p className="font-semibold text-black">{formatTime(submission.timeTakenSec)}</p>
              <p className="text-xs text-gray-400">Time Taken</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">{submission.answers.filter(a => a.isCorrect).length}</p>
              <p className="text-xs text-gray-400">Correct</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-black">{submission.answers.filter(a => !a.isCorrect).length}</p>
              <p className="text-xs text-gray-400">Incorrect</p>
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-5">
            <h2 className="font-bold text-black text-sm mb-4">Marks by Topic</h2>
            <div className="space-y-3">
              {Object.entries(topicBreakdown).map(([topic, { earned, total }]) => {
                const topicPct = total > 0 ? (earned / total) * 100 : 0;
                return (
                  <div key={topic}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium">{topic}</span>
                      <span className="text-gray-500">{earned}/{total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${topicPct}%`,
                          backgroundColor: topicPct >= 75 ? "#16A34A" : topicPct >= 50 ? "#D97706" : "#DC2626",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-200"
            onClick={() => router.push(`/dashboard/student/classroom/${classroomId}`)}
          >
            Back to Class
          </Button>
        </div>
      </div>
    </div>
  );
}
