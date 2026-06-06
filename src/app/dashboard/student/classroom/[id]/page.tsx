"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnouncementsTab from "@/components/teacher/AnnouncementsTab";
import StudentQuizzesTab from "@/components/student/StudentQuizzesTab";
import MyPerformanceTab from "@/components/student/MyPerformanceTab";

interface Classroom {
  _id: string;
  name: string;
  subject: string;
  joinCode: string;
}

export default function StudentClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClassroom = useCallback(async () => {
    try {
      const res = await fetch(`/api/classrooms/${id}`);
      if (!res.ok) { router.push("/dashboard/student"); return; }
      const data = await res.json();
      setClassroom(data.classroom);
    } catch {
      toast.error("Failed to load classroom");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchClassroom(); }, [fetchClassroom]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!classroom) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/student")}
              className="text-gray-500 hover:text-black -ml-2 gap-1"
            >
              ← Back
            </Button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-black text-base leading-none truncate">{classroom.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{classroom.subject}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="announcements">
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6 w-full sm:w-auto">
            <TabsTrigger value="announcements" className="rounded-lg text-sm data-[state=active]:bg-black data-[state=active]:text-yellow-400">
              Announcements
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="rounded-lg text-sm data-[state=active]:bg-black data-[state=active]:text-yellow-400">
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-lg text-sm data-[state=active]:bg-black data-[state=active]:text-yellow-400">
              My Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <AnnouncementsTab classroomId={id} role="student" />
          </TabsContent>
          <TabsContent value="quizzes">
            <StudentQuizzesTab classroomId={id} />
          </TabsContent>
          <TabsContent value="performance">
            <MyPerformanceTab classroomId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
