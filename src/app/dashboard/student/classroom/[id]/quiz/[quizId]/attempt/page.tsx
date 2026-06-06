"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, HelpCircle, Award, FileText, ChevronRight } from "lucide-react";

type QuestionType = "mcq" | "msq" | "truefalse" | "fillblank";

interface Question {
  _id: string;
  type: QuestionType;
  stem: string;
  options?: string[];
  marks: number;
  topic: string;
  order: number;
}

interface Quiz {
  _id: string;
  title: string;
  timeLimitMin: number;
  startAt: string;
  endAt: string;
  questions: Question[];
}

export default function QuizAttemptPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.id as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const startTimeRef = useRef<Date | null>(null);

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      const data = await res.json();
      if (!res.ok) { router.push(`/dashboard/student/classroom/${classroomId}`); return; }

      // Check if already submitted
      const subRes = await fetch(`/api/quizzes/${quizId}/my-submission`);
      const subData = await subRes.json();
      if (subData.submission) {
        router.push(`/dashboard/student/classroom/${classroomId}/quiz/${quizId}/result`);
        return;
      }

      setQuiz(data.quiz);
      setTimeLeft(data.quiz.timeLimitMin * 60);
    } catch {
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }, [quizId, classroomId, router]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  // Countdown timer
  useEffect(() => {
    if (!started || timeLeft <= 0 || submitting) return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submitting]);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    const timeTakenSec = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      : 0;

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeTakenSec }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Submission failed");
        setSubmitting(false);
        return;
      }
      if (autoSubmit) toast.info("Time's up! Quiz auto-submitted.");
      else toast.success("Quiz submitted!");
      router.push(`/dashboard/student/classroom/${classroomId}/quiz/${quizId}/result`);
    } catch {
      toast.error("Network error during submission");
      setSubmitting(false);
    }
  }, [answers, classroomId, quizId, router, submitting]);

  const startQuiz = () => {
    startTimeRef.current = new Date();
    setStarted(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const setAnswer = (qId: string, val: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const toggleMSQ = (qId: string, val: string) => {
    const curr = (answers[qId] as string[]) || [];
    setAnswer(qId, curr.includes(val) ? curr.filter(v => v !== val) : [...curr, val]);
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText size={28} className="text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">{quiz.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1"><Clock size={13} /> {quiz.timeLimitMin} minutes</span>
            <span className="flex items-center gap-1"><HelpCircle size={13} /> {quiz.questions.length} questions</span>
            <span className="flex items-center gap-1"><Award size={13} /> {quiz.questions.reduce((s, q) => s + q.marks, 0)} marks</span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold text-black">Before you start:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You cannot go back to a previous question</li>
              <li>• The timer starts immediately</li>
              <li>• Unanswered questions count as incorrect</li>
              <li>• Quiz auto-submits when time runs out</li>
            </ul>
          </div>
          <Button onClick={startQuiz} className="w-full h-12 btn-yellow border-0 font-bold text-base">
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;
  const timerUrgent = timeLeft < 60;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className={`sticky top-0 z-10 border-b ${timerUrgent ? "border-red-200 bg-red-50" : "border-gray-100 bg-white"} transition-colors duration-500`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">{quiz.title}</p>
            <Progress value={progress} className="h-1.5" />
          </div>
          <div className={`font-bold text-lg tabular-nums flex items-center gap-1.5 ${timerUrgent ? "text-red-500 animate-pulse" : "text-black"}`}>
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
        </div>
        <p className="text-xs text-center text-gray-400 pb-2">
          Question {currentIdx + 1} of {quiz.questions.length}
        </p>
      </div>

      {/* Question Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{question.topic}</span>
          <span className="text-xs text-gray-400">{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
        </div>

        <h2 className="text-lg font-semibold text-black mb-8 leading-relaxed">{question.stem}</h2>

        {/* MCQ */}
        {question.type === "mcq" && question.options && (
          <div className="space-y-3">
            {question.options.map((opt, oi) => {
              const label = ["A", "B", "C", "D"][oi];
              const selected = answers[question._id] === label;
              return (
                <button
                  key={oi}
                  onClick={() => setAnswer(question._id, label)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 ${
                    selected ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400 bg-white text-black"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                    selected ? "border-yellow-400 text-yellow-400" : "border-gray-300 text-gray-500"
                  }`}>
                    {label}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* MSQ */}
        {question.type === "msq" && question.options && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 mb-4">Select all that apply</p>
            {question.options.map((opt, oi) => {
              const label = ["A", "B", "C", "D"][oi];
              const selected = (answers[question._id] as string[] || []).includes(label);
              return (
                <button
                  key={oi}
                  onClick={() => toggleMSQ(question._id, label)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 ${
                    selected ? "border-black bg-black text-white" : "border-gray-200 hover:border-gray-400 bg-white text-black"
                  }`}
                >
                  <span className={`w-7 h-7 rounded border-2 text-xs font-bold flex items-center justify-center flex-shrink-0 transition-all ${
                    selected ? "border-yellow-400 bg-yellow-400 text-black" : "border-gray-300 text-gray-400"
                  }`}>
                    {selected ? "✓" : label}
                  </span>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* True/False */}
        {question.type === "truefalse" && (
          <div className="grid grid-cols-2 gap-4">
            {["True", "False"].map(val => {
              const selected = answers[question._id] === val;
              return (
                <button
                  key={val}
                  onClick={() => setAnswer(question._id, val)}
                  className={`p-6 rounded-xl border-2 font-bold text-lg transition-all duration-150 ${
                    selected ? "border-black bg-black text-yellow-400" : "border-gray-200 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* Fill in Blank */}
        {question.type === "fillblank" && (
          <div>
            <input
              type="text"
              placeholder="Type your answer here..."
              value={(answers[question._id] as string) || ""}
              onChange={e => setAnswer(question._id, e.target.value)}
              className="w-full border-b-2 border-gray-300 focus:border-yellow-400 outline-none text-lg py-3 text-black font-medium transition-colors bg-transparent"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {Object.keys(answers).length}/{quiz.questions.length} answered
          </p>
          {isLast ? (
            <Button
              className="btn-yellow border-0 font-bold px-8"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Submitting...
                </span>
              ) : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              className="bg-black text-white font-bold px-8 hover:bg-gray-800"
              onClick={() => setCurrentIdx(i => i + 1)}
            >
              Next <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
