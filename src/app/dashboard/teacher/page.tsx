"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, BookOpen, Copy, Check, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Classroom {
  _id: string;
  name: string;
  subject: string;
  joinCode: string;
  studentIds: string[];
  createdAt: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { data: classroomsData, isLoading: loading, mutate } = useSWR<{ classrooms: Classroom[] }>("/api/classrooms", {
    onError: () => router.push("/auth/login"),
  });
  const classrooms = classroomsData?.classrooms ?? [];

  const { data: meData } = useSWR<{ fullName?: string }>("/api/auth/me");
  const userName = meData?.fullName ?? "";

  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", subject: "" });
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copiedCreated, setCopiedCreated] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim()) { toast.error("Classroom name is required"); return; }
    if (!newClass.subject.trim()) { toast.error("Subject is required"); return; }

    setCreating(true);
    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create classroom"); return; }
      // Update cache optimistically
      mutate(
        { classrooms: [data.classroom, ...classrooms] },
        { revalidate: false }
      );
      setCreatedCode(data.classroom.joinCode);
      setNewClass({ name: "", subject: "" });
      toast.success("Classroom created!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCreated(true);
    toast.success("Join code copied!");
    setTimeout(() => setCopiedCreated(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-yellow-400 font-bold text-sm">V</span>
            </div>
            <div>
              <h1 className="font-bold text-black text-base leading-none">VidyaSetu</h1>
              <p className="text-xs text-gray-400 mt-0.5">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userName && (
              <span className="text-sm text-gray-600 hidden sm:block">Hi, {userName.split(" ")[0]}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/teacher/campus")}
              className="text-xs border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-colors gap-1.5"
            >
              <Building2 size={13} />
              Campus Hub
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs border-gray-200 hover:bg-black hover:text-white transition-colors"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title + New Classroom Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-black">My Classrooms</h2>
            <p className="text-gray-500 text-sm mt-1">{classrooms.length} classroom{classrooms.length !== 1 ? "s" : ""}</p>
          </div>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreatedCode(null); }}>
            <DialogTrigger
              render={
                <Button className="btn-yellow border-0 font-semibold gap-1.5">
                  <Plus size={15} />
                  New Classroom
                </Button>
              }
            />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  {createdCode ? "Classroom Created" : "New Classroom"}
                </DialogTitle>
              </DialogHeader>

              {createdCode ? (
                <div className="space-y-4 py-2">
                  <p className="text-sm text-gray-600">Share this join code with your students:</p>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <span className="text-3xl font-bold text-black tracking-widest flex-1">{createdCode}</span>
                    <Button
                      size="sm"
                      className="btn-yellow border-0 font-semibold text-xs gap-1"
                      onClick={() => copyCode(createdCode)}
                    >
                      {copiedCreated ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCreated ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <Button
                    className="w-full bg-black text-white hover:bg-gray-800 font-semibold"
                    onClick={() => { setOpen(false); setCreatedCode(null); }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="className">Classroom Name</Label>
                    <Input
                      id="className"
                      placeholder="e.g. Mathematics Grade 10"
                      value={newClass.name}
                      onChange={e => setNewClass(p => ({ ...p, name: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="e.g. Mathematics"
                      value={newClass.subject}
                      onChange={e => setNewClass(p => ({ ...p, subject: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 btn-yellow border-0 font-semibold"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Classroom"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Classrooms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-yellow-500" />
            </div>
            <h3 className="font-semibold text-black mb-1">No classrooms yet</h3>
            <p className="text-gray-500 text-sm">Create your first classroom to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map(classroom => (
              <Card
                key={classroom._id}
                className="border border-gray-100 shadow-none hover:border-yellow-300 hover:shadow-md transition-all duration-200 cursor-pointer card-hover group"
                onClick={() => router.push(`/dashboard/teacher/classroom/${classroom._id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                      <BookOpen size={18} className="text-yellow-600" />
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg font-mono">{classroom.joinCode}</span>
                  </div>
                  <h3 className="font-bold text-black text-base mb-1 line-clamp-1">{classroom.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{classroom.subject}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users size={12} />
                    <span>{classroom.studentIds.length} student{classroom.studentIds.length !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
