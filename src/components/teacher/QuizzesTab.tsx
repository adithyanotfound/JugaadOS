"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Award, HelpCircle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  timeLimitMin: number;
  startAt: string;
  endAt: string;
  published: boolean;
  questions: Array<{ marks: number }>;
  createdAt: string;
}

interface Props {
  classroomId: string;
  role: "teacher" | "student";
}

export default function QuizzesTab({ classroomId, role }: Props) {
  const router = useRouter();
  const { data, isLoading: loading, mutate } = useSWR<{ quizzes: Quiz[] }>(`/api/classrooms/${classroomId}/quizzes`);
  const quizzes = data?.quizzes ?? [];
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeLimitMin: 45,
    startAt: "",
    endAt: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.startAt) { toast.error("Start time is required"); return; }
    if (!form.endAt) { toast.error("End time is required"); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      toast.error("End time must be after start time");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create quiz"); return; }
      toast.success("Quiz created! Now add questions.");
      setOpen(false);
      router.push(`/dashboard/teacher/classroom/${classroomId}/quiz/${data.quiz._id}`);
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date();
    const start = new Date(quiz.startAt);
    const end = new Date(quiz.endAt);
    if (!quiz.published) return { label: "Draft", color: "bg-gray-100 text-gray-600" };
    if (now < start) return { label: "Upcoming", color: "bg-yellow-100 text-yellow-800" };
    if (now >= start && now <= end) return { label: "Live", color: "bg-black text-yellow-400" };
    return { label: "Ended", color: "bg-gray-100 text-gray-600" };
  };

  const totalMarks = (quiz: Quiz) => quiz.questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6">
      {role === "teacher" && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="btn-yellow border-0 font-semibold gap-1.5">
                  <Plus size={15} /> New Quiz
                </Button>
              }
            />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Quiz Title</Label>
                  <Input
                    placeholder="e.g. Chapter 3 Assessment"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Instructions or notes for students..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={form.timeLimitMin}
                    onChange={e => setForm(f => ({ ...f, timeLimitMin: parseInt(e.target.value) || 45 }))}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                      className="h-11 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                      className="h-11 text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 btn-yellow border-0 font-semibold"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create & Build Quiz"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No quizzes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => {
            const status = getQuizStatus(quiz);
            return (
              <Card
                key={quiz._id}
                className="border border-gray-100 shadow-none hover:border-yellow-300 transition-all duration-200 cursor-pointer"
                onClick={() => role === "teacher" && router.push(`/dashboard/teacher/classroom/${classroomId}/quiz/${quiz._id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-black text-sm">{quiz.title}</h3>
                        <Badge className={`text-xs px-2 py-0.5 border-0 ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      {quiz.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{quiz.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={11} /> {quiz.timeLimitMin} min</span>
                        <span className="flex items-center gap-1"><Award size={11} /> {totalMarks(quiz)} marks</span>
                        <span className="flex items-center gap-1"><HelpCircle size={11} /> {quiz.questions.length} questions</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
                    <span>Start: {format(new Date(quiz.startAt), "MMM d, h:mm a")}</span>
                    <span>End: {format(new Date(quiz.endAt), "MMM d, h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
