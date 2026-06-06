"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, ClipboardList, BookCheck, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  _id: string;
  content: string;
  type: "general" | "assignment" | "test";
  dueDate?: string;
  attachmentName?: string;
  createdAt: string;
}

interface Props {
  classroomId: string;
  role: "teacher" | "student";
}

const TYPE_CONFIG = {
  general: {
    label: "Announcement",
    Icon: Megaphone,
    color: "text-gray-500",
    bg: "bg-gray-50",
    badge: "bg-gray-100 text-gray-700",
  },
  assignment: {
    label: "Assignment",
    Icon: ClipboardList,
    color: "text-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  },
  test: {
    label: "Test / Exam",
    Icon: BookCheck,
    color: "text-red-500",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
};

export default function AnnouncementsTab({ classroomId, role }: Props) {
  const { data, isLoading: loading, mutate } = useSWR<{ announcements: Announcement[] }>(
    `/api/classrooms/${classroomId}/announcements`
  );
  const announcements = data?.announcements ?? [];
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"general" | "assignment" | "test">("general");
  const [dueDate, setDueDate] = useState("");

  const handlePost = async () => {
    if (!content.trim()) { toast.error("Announcement cannot be empty"); return; }
    if ((type === "assignment" || type === "test") && !dueDate) {
      toast.error("Please set a due date for this " + (type === "assignment" ? "assignment" : "test"));
      return;
    }
    setPosting(true);
    try {
      const payload: Record<string, unknown> = { content, type };
      if (dueDate) payload.dueDate = new Date(dueDate).toISOString();

      const res = await fetch(`/api/classrooms/${classroomId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to post"); return; }
      mutate({ announcements: [d.announcement, ...announcements] }, { revalidate: false });
      setContent("");
      setType("general");
      setDueDate("");
      toast.success("Posted successfully!");
    } catch {
      toast.error("Network error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Post form — teacher only */}
      {role === "teacher" && (
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-4 space-y-3">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {(["general", "assignment", "test"] as const).map(t => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-200 ${
                      type === t
                        ? "border-yellow-400 bg-yellow-50 text-black"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <cfg.Icon size={13} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <Textarea
              placeholder={
                type === "general"
                  ? "Write an announcement for your students..."
                  : type === "assignment"
                  ? "Describe the assignment..."
                  : "Describe the test/exam..."
              }
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              maxLength={2000}
            />

            {/* Due date — only for assignment/test */}
            {(type === "assignment" || type === "test") && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Calendar size={12} />
                  Due Date *
                </Label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{content.length}/2000</span>
              <Button
                onClick={handlePost}
                disabled={posting || !content.trim()}
                className="btn-yellow border-0 font-semibold text-sm"
              >
                {posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const cfg = TYPE_CONFIG[ann.type ?? "general"];
            return (
              <Card key={ann._id} className="border border-gray-100 shadow-none hover:border-yellow-200 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                        <cfg.Icon size={14} className={cfg.color} />
                      </div>
                      {ann.type !== "general" && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(ann.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  <p className="text-black text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>

                  {/* Due date badge */}
                  {ann.dueDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                      <Calendar size={12} className="text-red-500" />
                      <span className="text-red-600">
                        Due: {format(new Date(ann.dueDate), "MMMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
