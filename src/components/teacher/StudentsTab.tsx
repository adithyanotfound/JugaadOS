"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface Student {
  _id: string;
  fullName: string;
  grade?: string;
  username?: string;
  createdAt: string;
}

interface Props {
  classroomId: string;
}

export default function StudentsTab({ classroomId }: Props) {
  const { data, isLoading: loading, mutate } = useSWR<{ students: Student[] }>(`/api/classrooms/${classroomId}/students`);
  const students = data?.students ?? [];
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (studentId: string, name: string) => {
    if (!confirm(`Remove ${name} from this classroom?`)) return;
    setRemoving(studentId);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students/${studentId}`, {
        method: "DELETE",
      });
      if (!res.ok) { toast.error("Failed to remove student"); return; }
      mutate({ students: students.filter(s => s._id !== studentId) }, { revalidate: false });
      toast.success(`${name} removed from classroom`);
    } catch {
      toast.error("Network error");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full" />
            <div className="flex-1">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16">
          <Users size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No students enrolled yet</p>
        <p className="text-xs text-gray-400 mt-1">Share the join code with students</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">{students.length} enrolled student{students.length !== 1 ? "s" : ""}</p>
      {students.map(student => (
        <Card key={student._id} className="border border-gray-100 shadow-none hover:border-yellow-200 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-black text-sm">
                {student.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-black text-sm truncate">{student.fullName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {student.grade && (
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{student.grade}</span>
                )}
                {student.username && (
                  <span className="text-xs text-gray-400">@{student.username}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">
                Joined {format(new Date(student.createdAt), "MMM d")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                onClick={() => handleRemove(student._id, student.fullName)}
                disabled={removing === student._id}
              >
                {removing === student._id ? "..." : "Remove"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
