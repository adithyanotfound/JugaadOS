"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LostFoundBoard from "@/components/campus/LostFoundBoard";
import NoticeBoardComponent from "@/components/campus/NoticeBoard";
import AcademicCalendar from "@/components/campus/AcademicCalendar";
import NotebookAI from "@/components/campus/NotebookAI";
import FlashcardManager from "@/components/campus/FlashcardManager";
import { ArrowLeft, Search, Bell, CalendarDays, Brain, BookOpen } from "lucide-react";

export default function StudentCampusPage() {
  const router = useRouter();
  const { data: meData } = useSWR<{ fullName?: string; userId?: string }>("/api/auth/me");
  const userId = meData?.userId ?? "";

  const [flashcardPdf, setFlashcardPdf] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("lost-found");

  const handleGenerateFlashcards = (pdf: File | null) => {
    setFlashcardPdf(pdf);
    setActiveTab("flashcards");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/student")}
              className="text-gray-500 hover:text-black -ml-2 gap-1"
            >
              <ArrowLeft size={15} />
              Back
            </Button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 font-bold text-sm">C</span>
              </div>
              <div>
                <h1 className="font-bold text-black text-base leading-none">Campus Hub</h1>
                <p className="text-xs text-gray-400 mt-0.5">Your campus, all in one place</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6 flex flex-wrap gap-1 h-auto">
            <TabsTrigger
              value="lost-found"
              className="rounded-lg text-xs sm:text-sm gap-1.5 data-[state=active]:bg-black data-[state=active]:text-yellow-400"
            >
              <Search size={13} />
              Lost &amp; Found
            </TabsTrigger>
            <TabsTrigger
              value="notice-board"
              className="rounded-lg text-xs sm:text-sm gap-1.5 data-[state=active]:bg-black data-[state=active]:text-yellow-400"
            >
              <Bell size={13} />
              Notice Board
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-lg text-xs sm:text-sm gap-1.5 data-[state=active]:bg-black data-[state=active]:text-yellow-400"
            >
              <CalendarDays size={13} />
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="notebook-ai"
              className="rounded-lg text-xs sm:text-sm gap-1.5 data-[state=active]:bg-black data-[state=active]:text-yellow-400"
            >
              <Brain size={13} />
              Notebook AI
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="rounded-lg text-xs sm:text-sm gap-1.5 data-[state=active]:bg-black data-[state=active]:text-yellow-400"
            >
              <BookOpen size={13} />
              Flashcards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost-found">
            <LostFoundBoard currentUserId={userId} currentUserRole="student" />
          </TabsContent>

          <TabsContent value="notice-board">
            <NoticeBoardComponent currentUserId={userId} currentUserRole="student" />
          </TabsContent>

          <TabsContent value="calendar">
            <AcademicCalendar role="student" />
          </TabsContent>

          <TabsContent value="notebook-ai">
            <NotebookAI onGenerateFlashcards={handleGenerateFlashcards} />
          </TabsContent>

          <TabsContent value="flashcards">
            <FlashcardManager initialPdfFile={flashcardPdf} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
