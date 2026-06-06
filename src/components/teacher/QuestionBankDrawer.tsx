"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface BankQuestion {
  _id: string;
  question: {
    type: string;
    stem: string;
    options?: string[];
    correctAnswer: string | string[];
    marks: number;
    topic: string;
    order: number;
  };
  subject: string;
  topic: string;
  createdAt: string;
}

interface Props {
  onImport: (q: BankQuestion["question"]) => void;
}

export default function QuestionBankDrawer({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");

  const fetchBank = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subjectFilter) params.set("subject", subjectFilter);
      if (topicFilter) params.set("topic", topicFilter);
      const res = await fetch(`/api/question-bank?${params}`);
      const data = await res.json();
      if (res.ok) setQuestions(data.questions);
    } catch {
      toast.error("Failed to load question bank");
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, topicFilter]);

  useEffect(() => {
    if (open) fetchBank();
  }, [open, fetchBank]);

  const typeColors: Record<string, string> = {
    mcq: "bg-black text-yellow-400",
    msq: "bg-yellow-100 text-yellow-800",
    truefalse: "bg-gray-100 text-gray-700",
    fillblank: "bg-gray-50 text-gray-600",
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="text-xs border-gray-200 gap-1">
            Question Bank
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-bold text-base">Question Bank</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 px-6">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input
                placeholder="Filter by subject"
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Topic</Label>
              <Input
                placeholder="Filter by topic"
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <Button size="sm" onClick={fetchBank} className="w-full bg-black text-white hover:bg-gray-800 text-xs font-semibold">
            Search
          </Button>

          {/* Questions */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-3xl mb-3 block">📭</span>
              <p className="text-gray-500 text-sm">No questions in bank yet</p>
              <p className="text-xs text-gray-400 mt-1">Questions are saved automatically when you save a quiz</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
              {questions.map(bq => (
                <div key={bq._id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={`text-xs border-0 ${typeColors[bq.question.type] || "bg-gray-100 text-gray-600"}`}>
                      {bq.question.type.toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      className="btn-yellow border-0 text-xs h-7 px-3 font-semibold flex-shrink-0"
                      onClick={() => {
                        onImport(bq.question);
                        toast.success("Question imported!");
                      }}
                    >
                      Import
                    </Button>
                  </div>
                  <p className="text-xs text-black font-medium mb-1 line-clamp-2">{bq.question.stem}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{bq.subject}</span>
                    <span>·</span>
                    <span>{bq.topic}</span>
                    <span>·</span>
                    <span>{bq.question.marks} mark{bq.question.marks !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
