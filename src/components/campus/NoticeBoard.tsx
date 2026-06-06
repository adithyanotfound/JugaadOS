"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pin, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

interface Notice {
  _id: string;
  title: string;
  content: string;
  category: "club" | "academic" | "general" | "event";
  postedByName: string;
  postedByRole: "teacher" | "student";
  isPinned: boolean;
  createdAt: string;
  postedBy: string;
}

interface Props {
  currentUserId?: string;
  currentUserRole?: "teacher" | "student";
}

const CATEGORY_CONFIG = {
  club: { label: "Club", color: "bg-purple-100 text-purple-700", emoji: "🏛️" },
  academic: { label: "Academic", color: "bg-blue-100 text-blue-700", emoji: "📚" },
  general: { label: "General", color: "bg-gray-100 text-gray-700", emoji: "📌" },
  event: { label: "Event", color: "bg-yellow-100 text-yellow-700", emoji: "🎉" },
};

type CategoryFilter = "all" | "club" | "academic" | "general" | "event";

export default function NoticeBoardComponent({ currentUserId, currentUserRole }: Props) {
  const { data, isLoading, mutate } = useSWR<{ notices: Notice[] }>("/api/notice-board");
  const notices = data?.notices ?? [];

  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general" as Notice["category"],
  });

  const filtered = notices.filter(n => catFilter === "all" || n.category === catFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/notice-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to post"); return; }
      mutate({ notices: [d.notice, ...notices] }, { revalidate: false });
      setForm({ title: "", content: "", category: "general" });
      setOpen(false);
      toast.success("Notice posted!");
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notice-board/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      mutate({ notices: notices.filter(n => n._id !== id) }, { revalidate: false });
      toast.success("Notice deleted!");
    } catch {
      toast.error("Network error");
    }
  };

  const handlePin = async (notice: Notice) => {
    try {
      const res = await fetch(`/api/notice-board/${notice._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !notice.isPinned }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error("Failed to pin"); return; }
      mutate(
        { notices: notices.map(n => n._id === notice._id ? { ...n, isPinned: d.notice.isPinned } : n) },
        { revalidate: false }
      );
      toast.success(d.notice.isPinned ? "Pinned!" : "Unpinned!");
    } catch {
      toast.error("Network error");
    }
  };

  const categoryTabs: { label: string; value: CategoryFilter }[] = [
    { label: "All", value: "all" },
    { label: "🏛️ Club", value: "club" },
    { label: "📚 Academic", value: "academic" },
    { label: "🎉 Event", value: "event" },
    { label: "📌 General", value: "general" },
  ];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} notice{filtered.length !== 1 ? "s" : ""}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="btn-yellow border-0 font-semibold gap-1.5">
                <Plus size={15} /> Post Notice
              </Button>
            }
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Post a Notice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              {/* Category selector */}
              <div className="space-y-1.5">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["academic", "club", "event", "general"] as const).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className={`py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          form.category === cat
                            ? "border-yellow-400 bg-yellow-50 text-black"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {cfg.emoji} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder="Notice title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={150}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Content *</Label>
                <Textarea
                  placeholder="Write your notice here..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  maxLength={3000}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{form.content.length}/3000</p>
              </div>
              <Button type="submit" className="w-full h-11 btn-yellow border-0 font-semibold" disabled={submitting}>
                {submitting ? "Posting..." : "Post Notice"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {categoryTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setCatFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              catFilter === tab.value
                ? "bg-black text-yellow-400"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notices */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 text-sm">No notices yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(notice => {
            const cfg = CATEGORY_CONFIG[notice.category];
            const isOwner = notice.postedBy === currentUserId;
            const isTeacher = currentUserRole === "teacher";
            const canDelete = isOwner || isTeacher;

            return (
              <Card
                key={notice._id}
                className={`border shadow-none transition-all duration-200 ${
                  notice.isPinned ? "border-yellow-300 bg-yellow-50/20" : "border-gray-100 hover:border-yellow-200"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.isPinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isTeacher && (
                        <button
                          onClick={() => handlePin(notice)}
                          className={`text-gray-400 hover:text-yellow-500 transition-colors`}
                          title={notice.isPinned ? "Unpin" : "Pin to top"}
                        >
                          <Pin size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(notice._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-black text-base mb-2">{notice.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                    {notice.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {notice.postedByName}
                      {notice.postedByRole === "teacher" && (
                        <span className="ml-1 text-yellow-600 font-medium">· Teacher</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {format(new Date(notice.createdAt), "MMM d, yyyy")}
                    </span>
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
