"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X, Clock, Inbox } from "lucide-react";
import { format } from "date-fns";

interface Submission {
  _id: string;
  student: { fullName: string; grade?: string; username?: string };
  score: number;
  totalMarks: number;
  timeTakenSec: number;
  submittedAt: string;
  answers: Array<{ questionId: string; answer: unknown; isCorrect: boolean; marksEarned: number }>;
}

interface QuizQuestion {
  _id: string;
  stem: string;
  type: string;
  correctAnswer: unknown;
  marks: number;
  topic: string;
}

interface Props {
  quizId: string;
  onClose: () => void;
}

export default function SubmissionsPanel({ quizId, onClose }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quiz, setQuiz] = useState<{ title: string; questions: QuizQuestion[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submissions`);
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.submissions);
        setQuiz(data.quiz);
      }
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-black">Submissions</h2>
          <p className="text-xs text-gray-400">{quiz?.title}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 h-8 w-8 p-0">
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse h-16" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <Inbox size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No submissions yet</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
            {submissions.map(sub => {
              const pct = sub.totalMarks > 0 ? Math.round((sub.score / sub.totalMarks) * 100) : 0;
              const isExpanded = expanded === sub._id;
              return (
                <div key={sub._id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : sub._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-black text-sm">{sub.student?.fullName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sub.student?.grade && `${sub.student.grade} · `}
                          {format(new Date(sub.submittedAt), "MMM d, h:mm a")} · <Clock size={10} className="inline" /> {formatTime(sub.timeTakenSec)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                          {sub.score}/{sub.totalMarks}
                        </p>
                        <p className="text-xs text-gray-400">{pct}%</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && quiz && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                      {quiz.questions.map((q, qi) => {
                        const answer = sub.answers[qi];
                        return (
                          <div key={q._id} className={`rounded-lg p-3 ${answer?.isCorrect ? "bg-green-50" : "bg-red-50"}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-xs font-medium text-black">{qi + 1}. {q.stem}</p>
                              <span className={`text-xs font-bold flex-shrink-0 ${answer?.isCorrect ? "text-green-600" : "text-red-500"}`}>
                                {answer?.isCorrect ? `+${answer.marksEarned}` : "0"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              Given: <span className="font-medium">{Array.isArray(answer?.answer) ? answer.answer.join(", ") : String(answer?.answer ?? "—")}</span>
                            </p>
                            {!answer?.isCorrect && (
                              <p className="text-xs text-green-700 mt-0.5">
                                Correct: <span className="font-medium">{Array.isArray(q.correctAnswer) ? (q.correctAnswer as string[]).join(", ") : String(q.correctAnswer)}</span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
