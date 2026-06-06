"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Award, HelpCircle, FileText } from "lucide-react";
import { format, differenceInSeconds, differenceInHours } from "date-fns";

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  timeLimitMin: number;
  startAt: string;
  endAt: string;
  published: boolean;
  questions: Array<{ marks: number }>;
}

interface Props {
  classroomId: string;
}

type QuizStatus = "upcoming" | "live" | "attempted" | "missed";

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  useEffect(() => {
    const update = () => setTimeLeft(Math.max(0, differenceInSeconds(target, new Date())));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  return { timeLeft, display: `${h > 0 ? `${h}h ` : ""}${m}m ${s}s` };
}

function QuizCard({ quiz, classroomId, submittedIds }: { quiz: Quiz; classroomId: string; submittedIds: Set<string> }) {
  const router = useRouter();
  const now = new Date();
  const start = new Date(quiz.startAt);
  const end = new Date(quiz.endAt);
  const hasSubmitted = submittedIds.has(quiz._id);

  let status: QuizStatus;
  if (hasSubmitted) status = "attempted";
  else if (now < start) status = "upcoming";
  else if (now >= start && now <= end) status = "live";
  else status = "missed";

  const countdown = useCountdown(status === "upcoming" ? start : end);
  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);

  const statusConfig = {
    upcoming: { label: "Upcoming", color: "status-upcoming" },
    live: { label: "Live", color: "status-live" },
    attempted: { label: "Attempted", color: "status-attempted" },
    missed: { label: "Missed", color: "status-missed" },
  };

  return (
    <Card className="border border-gray-100 shadow-none hover:border-yellow-200 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-black text-sm mb-1">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-xs text-gray-500 line-clamp-1">{quiz.description}</p>
            )}
          </div>
          <Badge className={`text-xs border-0 flex-shrink-0 ${statusConfig[status].color}`}>
            {statusConfig[status].label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 flex-wrap">
          <span className="flex items-center gap-1"><Clock size={11} /> {quiz.timeLimitMin} min</span>
          <span className="flex items-center gap-1"><Award size={11} /> {totalMarks} marks</span>
          <span className="flex items-center gap-1"><HelpCircle size={11} /> {quiz.questions.length} questions</span>
        </div>

        {/* Status-specific UI */}
        {status === "upcoming" && (
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Starts in</p>
            <p className="font-bold text-black text-sm">{countdown.display}</p>
            <p className="text-xs text-gray-400 mt-1">{format(start, "MMM d, h:mm a")}</p>
          </div>
        )}

        {status === "live" && (
          <div className="space-y-2">
            <div className="bg-black rounded-lg p-3 text-center">
              <p className="text-xs text-yellow-400 mb-1">Closes in</p>
              <p className="font-bold text-yellow-400 text-sm">{countdown.display}</p>
            </div>
            <Button
              className="w-full btn-yellow border-0 font-semibold"
              onClick={() => router.push(`/dashboard/student/classroom/${classroomId}/quiz/${quiz._id}/attempt`)}
            >
              Start Quiz
            </Button>
          </div>
        )}

        {status === "attempted" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-gray-200"
              onClick={() => router.push(`/dashboard/student/classroom/${classroomId}/quiz/${quiz._id}/result`)}
            >
              View Result
            </Button>
            {now > end && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-gray-200"
                onClick={() => router.push(`/dashboard/student/classroom/${classroomId}/quiz/${quiz._id}/review`)}
              >
                Review Answers
              </Button>
            )}
          </div>
        )}

        {status === "missed" && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Attempt window closed {format(end, "MMM d")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentQuizzesTab({ classroomId }: Props) {
  const { data: quizzesData, isLoading: loading } = useSWR<{ quizzes: Quiz[] }>(`/api/classrooms/${classroomId}/quizzes`);
  const quizzes = quizzesData?.quizzes ?? [];
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  // Fetch submission status for each quiz once list is available
  useEffect(() => {
    if (!quizzes.length) return;
    let cancelled = false;
    Promise.all(
      quizzes.map(async (q) => {
        const res = await fetch(`/api/quizzes/${q._id}/my-submission`);
        const data = await res.json();
        return data.submission ? q._id : null;
      })
    ).then(results => {
      if (cancelled) return;
      setSubmittedIds(new Set(results.filter(Boolean) as string[]));
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzes.length, classroomId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No quizzes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quizzes.map(quiz => (
        <QuizCard key={quiz._id} quiz={quiz} classroomId={classroomId} submittedIds={submittedIds} />
      ))}
    </div>
  );
}
