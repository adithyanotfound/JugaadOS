"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, Users, Building2 } from "lucide-react";
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
}

export default function StudentDashboard() {
  const router = useRouter();
  const { data: classroomsData, isLoading: loading, mutate } = useSWR<{ classrooms: Classroom[] }>("/api/classrooms/join", {
    onError: () => router.push("/auth/login"),
  });
  const classrooms = classroomsData?.classrooms ?? [];

  const { data: meData } = useSWR<{ fullName?: string }>("/api/auth/me");
  const userName = meData?.fullName ?? "";

  const [joining, setJoining] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { toast.error("Join code must be 6 characters"); return; }

    setJoining(true);
    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to join"); return; }
      mutate({ classrooms: [data.classroom, ...classrooms] }, { revalidate: false });
      setCode("");
      setOpen(false);
      toast.success(`Joined ${data.classroom.name}!`);
    } catch {
      toast.error("Network error");
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
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
              <p className="text-xs text-gray-400 mt-0.5">Student Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userName && (
              <span className="text-sm text-gray-600 hidden sm:block">Hi, {userName.split(" ")[0]}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/student/campus")}
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-black">My Classrooms</h2>
            <p className="text-gray-500 text-sm mt-1">{classrooms.length} joined</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="btn-yellow border-0 font-semibold gap-1.5">
                  <Plus size={15} /> Join Classroom
                </Button>
              }
            />
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Join a Classroom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>6-Character Join Code</Label>
                  <Input
                    placeholder="e.g. AB12CD"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6))}
                    className="h-12 text-center text-xl font-bold tracking-widest uppercase"
                    maxLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 btn-yellow border-0 font-semibold"
                  disabled={joining}
                >
                  {joining ? "Joining..." : "Join Classroom"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-yellow-500" />
            </div>
            <h3 className="font-semibold text-black mb-1">No classrooms yet</h3>
            <p className="text-gray-500 text-sm">Ask your teacher for the 6-character join code</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map(classroom => (
              <Card
                key={classroom._id}
                className="border border-gray-100 shadow-none hover:border-yellow-300 hover:shadow-md transition-all duration-200 cursor-pointer card-hover group"
                onClick={() => router.push(`/dashboard/student/classroom/${classroom._id}`)}
              >
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-100 transition-colors">
                    <BookOpen size={18} className="text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-black text-base mb-1 line-clamp-1">{classroom.name}</h3>
                  <p className="text-gray-500 text-sm">{classroom.subject}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
