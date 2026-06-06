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
import { Search, Plus, CheckCircle, MapPin, Phone, Clock } from "lucide-react";
import { format } from "date-fns";

interface LostFoundItem {
  _id: string;
  title: string;
  description: string;
  type: "lost" | "found";
  postedByName: string;
  postedByRole: "teacher" | "student";
  location: string;
  contactInfo: string;
  isResolved: boolean;
  createdAt: string;
  postedBy: string;
}

interface Props {
  currentUserId?: string;
  currentUserRole?: "teacher" | "student";
}

type FilterType = "all" | "lost" | "found" | "resolved";

export default function LostFoundBoard({ currentUserId, currentUserRole }: Props) {
  const { data, isLoading, mutate } = useSWR<{ items: LostFoundItem[] }>("/api/lost-found");
  const items = data?.items ?? [];

  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "lost" as "lost" | "found",
    location: "",
    contactInfo: "",
  });

  const filtered = items.filter((item) => {
    if (filter === "resolved") return item.isResolved;
    if (filter === "lost") return !item.isResolved && item.type === "lost";
    if (filter === "found") return !item.isResolved && item.type === "found";
    if (filter === "all") return !item.isResolved;
    return true;
  }).filter((item) =>
    search.trim()
      ? item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/lost-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to post"); return; }
      mutate({ items: [d.item, ...items] }, { revalidate: false });
      setForm({ title: "", description: "", type: "lost", location: "", contactInfo: "" });
      setOpen(false);
      toast.success("Posted successfully!");
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolved = async (item: LostFoundItem) => {
    try {
      const res = await fetch(`/api/lost-found/${item._id}`, { method: "PATCH" });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to update"); return; }
      mutate(
        { items: items.map(i => i._id === item._id ? { ...i, isResolved: d.item.isResolved } : i) },
        { revalidate: false }
      );
      toast.success(d.item.isResolved ? "Marked as resolved!" : "Reopened!");
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/lost-found/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      mutate({ items: items.filter(i => i._id !== id) }, { revalidate: false });
      toast.success("Deleted!");
    } catch {
      toast.error("Network error");
    }
  };

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: "Active", value: "all" },
    { label: "🔍 Lost", value: "lost" },
    { label: "✅ Found", value: "found" },
    { label: "Resolved", value: "resolved" },
  ];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 border-gray-200"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="btn-yellow border-0 font-semibold gap-1.5 shrink-0">
                <Plus size={15} /> Post Item
              </Button>
            }
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Report Lost or Found Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                {(["lost", "found"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                      form.type === t
                        ? t === "lost"
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t === "lost" ? "🔍 I Lost Something" : "✅ I Found Something"}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label>Item Title *</Label>
                <Input
                  placeholder="e.g. Blue water bottle"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  maxLength={100}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the item, when/where you lost or found it..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={1000}
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input
                    placeholder="e.g. Library, 2nd floor"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Info</Label>
                  <Input
                    placeholder="Phone or name"
                    value={form.contactInfo}
                    onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))}
                    className="h-11"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 btn-yellow border-0 font-semibold"
                disabled={submitting}
              >
                {submitting ? "Posting..." : "Post Report"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === tab.value
                ? "bg-black text-yellow-400"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Items grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 text-sm">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => {
            const isOwner = item.postedBy === currentUserId;
            const canManage = isOwner || currentUserRole === "teacher";

            return (
              <Card
                key={item._id}
                className={`border shadow-none transition-all duration-200 ${
                  item.isResolved
                    ? "border-green-100 bg-green-50/30"
                    : item.type === "lost"
                    ? "border-orange-100 hover:border-orange-200"
                    : "border-blue-100 hover:border-blue-200"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          item.isResolved
                            ? "bg-green-100 text-green-700"
                            : item.type === "lost"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.isResolved ? "✓ Resolved" : item.type === "lost" ? "🔍 Lost" : "✅ Found"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} />
                      {format(new Date(item.createdAt), "MMM d")}
                    </span>
                  </div>

                  <h3 className="font-bold text-black text-base mb-1.5 line-clamp-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">{item.description}</p>

                  <div className="space-y-1.5 mb-4">
                    {item.location && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <MapPin size={11} className="shrink-0" />
                        {item.location}
                      </p>
                    )}
                    {item.contactInfo && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone size={11} className="shrink-0" />
                        {item.contactInfo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      by {item.postedByName.split(" ")[0]}
                      {item.postedByRole === "teacher" && (
                        <span className="ml-1 text-yellow-600 font-medium">· Teacher</span>
                      )}
                    </span>
                    {canManage && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleResolved(item)}
                          className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle size={12} />
                          {item.isResolved ? "Reopen" : "Resolve"}
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
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
