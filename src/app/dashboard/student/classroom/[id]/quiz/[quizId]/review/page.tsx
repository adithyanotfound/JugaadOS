"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type QuestionType = "mcq" | "msq" | "truefalse" | "fillblank";

interface Question {
  _id: string;
  type: QuestionType;
  stem: string;
  options?: string[];
  correctAnswer: string | string[];
  marks: number;
  topic: string;
}

interface Answer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  marksEarned: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.id as string;
  const quizId = params.quizId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReview = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/my-submission`);
      const data = await res.json();
      if (res.ok && data.submission) {
        setAnswers(data.submission.answers);
        setQuestions(data.quiz.questions || []);
        setQuizTitle(data.quiz.title);
      } else {
        router.push(`/dashboard/student/classroom/${classroomId}`);
      }
    } catch {
      toast.error("Failed to load review");
    } finally {
      setLoading(false);
    }
  }, [quizId, classroomId, router]);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  const displayAnswer = (ans: string | string[] | null | undefined) => {
    if (!ans) return "—";
    return Array.isArray(ans) ? ans.join(", ") : String(ans);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/student/classroom/${classroomId}`)}
            className="text-gray-500 -ml-2"
          >
            ← Back
          </Button>
          <div>
            <h1 className="font-bold text-black text-sm">Review: {quizTitle}</h1>
            <p className="text-xs text-gray-400">{answers.filter(a => a.isCorrect).length}/{questions.length} correct</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {questions.map((q, idx) => {
          const ans = answers[idx];
          const isCorrect = ans?.isCorrect;

          return (
            <Card key={q._id} className={`border shadow-none ${isCorrect ? "border-green-200" : "border-red-200"}`}>
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="text-xs text-gray-400">Q{idx + 1} · {q.topic} · {q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                  </div>
                  <span className={`text-xs font-bold ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                    {ans?.marksEarned || 0}/{q.marks}
                  </span>
                </div>

                <p className="text-sm font-semibold text-black mb-4">{q.stem}</p>

                {/* Options for MCQ/MSQ */}
                {(q.type === "mcq" || q.type === "msq") && q.options && (
                  <div className="space-y-2 mb-3">
                    {q.options.map((opt, oi) => {
                      const label = ["A", "B", "C", "D"][oi];
                      const wasSelected = Array.isArray(ans?.answer) ? ans.answer.includes(label) : ans?.answer === label;
                      const isCorrectOpt = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(label) : q.correctAnswer === label;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            isCorrectOpt ? "bg-green-50 text-green-700" : wasSelected ? "bg-red-50 text-red-600" : "text-gray-500"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded border text-xs flex items-center justify-center font-bold ${
                            isCorrectOpt ? "border-green-400 bg-green-100" : wasSelected ? "border-red-400 bg-red-100" : "border-gray-200"
                          }`}>
                            {label}
                          </span>
                          <span>{opt}</span>
                          {isCorrectOpt && <span className="ml-auto">✓ Correct</span>}
                          {wasSelected && !isCorrectOpt && <span className="ml-auto">Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer display for other types */}
                {(q.type === "truefalse" || q.type === "fillblank") && (
                  <div className="space-y-2 text-xs">
                    <div className={`p-2 rounded-lg ${isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                      <span className="text-gray-500">Your answer: </span>
                      <span className={`font-semibold ${isCorrect ? "text-green-700" : "text-red-600"}`}>
                        {displayAnswer(ans?.answer)}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="p-2 rounded-lg bg-green-50">
                        <span className="text-gray-500">Correct answer: </span>
                        <span className="font-semibold text-green-700">
                          {displayAnswer(q.correctAnswer)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
