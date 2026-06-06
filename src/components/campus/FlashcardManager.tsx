"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen, Sparkles, Loader2 } from "lucide-react";
import FlashcardStudy from "./FlashcardStudy";
import { format } from "date-fns";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardDeck {
  _id: string;
  deckName: string;
  subject: string;
  cards: Flashcard[];
  sourceType: "pdf" | "prompt";
  createdAt: string;
}

interface Props {
  initialPdfFile?: File | null;
  initialContext?: string;
}

export default function FlashcardManager({ initialPdfFile, initialContext }: Props) {
  const { data, isLoading, mutate } = useSWR<{ decks: FlashcardDeck[] }>("/api/flashcards");
  const decks = data?.decks ?? [];

  const [studyDeck, setStudyDeck] = useState<FlashcardDeck | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewCards, setPreviewCards] = useState<Flashcard[]>([]);

  const [genForm, setGenForm] = useState({
    prompt: initialContext || "",
    subject: "",
    deckName: "",
    count: "10",
    sourceType: "prompt" as "pdf" | "prompt",
  });
  const [genPdf, setGenPdf] = useState<File | null>(initialPdfFile || null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genForm.prompt.trim() && !genPdf) {
      toast.error("Please enter a prompt or upload a PDF");
      return;
    }
    setGenerating(true);
    setPreviewCards([]);

    try {
      const formData = new FormData();
      formData.append("prompt", genForm.prompt);
      formData.append("subject", genForm.subject || "General");
      formData.append("count", genForm.count);
      if (genPdf) {
        formData.append("pdf", genPdf);
        formData.append("sourceType", "pdf");
      } else {
        formData.append("sourceType", "prompt");
      }

      const res = await fetch("/api/ai/flashcard-generate", {
        method: "POST",
        body: formData,
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to generate"); return; }
      setPreviewCards(d.cards);
      toast.success(`Generated ${d.cards.length} flashcards!`);
    } catch {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDeck = async () => {
    if (!genForm.deckName.trim()) {
      toast.error("Please enter a deck name");
      return;
    }
    if (previewCards.length === 0) {
      toast.error("Generate flashcards first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckName: genForm.deckName,
          subject: genForm.subject || "General",
          cards: previewCards,
          sourceType: genPdf ? "pdf" : "prompt",
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Failed to save"); return; }
      mutate({ decks: [d.deck, ...decks] }, { revalidate: false });
      setPreviewCards([]);
      setGenForm({ prompt: "", subject: "", deckName: "", count: "10", sourceType: "prompt" });
      setGenPdf(null);
      setGenerateOpen(false);
      toast.success("Deck saved!");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    try {
      const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      mutate({ decks: decks.filter(d => d._id !== id) }, { revalidate: false });
      toast.success("Deck deleted!");
    } catch {
      toast.error("Network error");
    }
  };

  if (studyDeck) {
    return (
      <FlashcardStudy
        deck={studyDeck}
        onBack={() => setStudyDeck(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{decks.length} deck{decks.length !== 1 ? "s" : ""} saved</p>

        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger
            render={
              <Button className="btn-yellow border-0 font-semibold gap-1.5">
                <Sparkles size={15} /> Generate Flashcards
              </Button>
            }
          />
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Flashcard Deck</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleGenerate} className="space-y-4 py-2">
              {/* Source toggle */}
              <div className="grid grid-cols-2 gap-2">
                {(["prompt", "pdf"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGenForm(f => ({ ...f, sourceType: type }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      genForm.sourceType === type
                        ? "border-yellow-400 bg-yellow-50 text-black"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {type === "prompt" ? "✏️ From Text Prompt" : "📄 From PDF Notes"}
                  </button>
                ))}
              </div>

              {genForm.sourceType === "pdf" ? (
                <div className="space-y-1.5">
                  <Label>Upload PDF *</Label>
                  <div
                    className="border-2 border-dashed border-gray-200 hover:border-yellow-300 rounded-xl p-6 text-center cursor-pointer transition-colors"
                    onClick={() => document.getElementById("fc-pdf-upload")?.click()}
                  >
                    <input
                      id="fc-pdf-upload"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setGenPdf(file);
                      }}
                    />
                    {genPdf ? (
                      <p className="text-sm font-semibold text-green-700">✅ {genPdf.name}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Click to upload PDF</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>What to create flashcards about? *</Label>
                  <textarea
                    placeholder='e.g. "Chapter 5: Photosynthesis — light reactions, Calvin cycle, key equations"'
                    value={genForm.prompt}
                    onChange={e => setGenForm(f => ({ ...f, prompt: e.target.value }))}
                    className="w-full min-h-[100px] rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400"
                    maxLength={2000}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g. Biology"
                    value={genForm.subject}
                    onChange={e => setGenForm(f => ({ ...f, subject: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Number of Cards</Label>
                  <select
                    value={genForm.count}
                    onChange={e => setGenForm(f => ({ ...f, count: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  >
                    {[5, 8, 10, 15, 20, 25, 30].map(n => (
                      <option key={n} value={n}>{n} cards</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 btn-yellow border-0 font-semibold"
                disabled={generating}
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Generating with AI...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} />
                    Generate Flashcards
                  </span>
                )}
              </Button>
            </form>

            {/* Preview generated cards */}
            {previewCards.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-black text-sm">{previewCards.length} Cards Generated</h4>
                  <span className="text-xs text-gray-400">Scroll to review</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {previewCards.slice(0, 5).map((card, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-black mb-1">Q: {card.front}</p>
                      <p className="text-xs text-gray-600">A: {card.back}</p>
                    </div>
                  ))}
                  {previewCards.length > 5 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      +{previewCards.length - 5} more cards
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label>Deck Name *</Label>
                    <Input
                      placeholder='e.g. "Chapter 5 — Photosynthesis"'
                      value={genForm.deckName}
                      onChange={e => setGenForm(f => ({ ...f, deckName: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <Button
                    onClick={handleSaveDeck}
                    className="w-full h-11 bg-black text-white hover:bg-gray-800 font-semibold"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Deck to My Flashcards"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Decks list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🃏</div>
          <h3 className="font-semibold text-black mb-1">No flashcard decks yet</h3>
          <p className="text-gray-500 text-sm">Generate your first deck using AI!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <Card
              key={deck._id}
              className="border border-gray-100 shadow-none hover:border-yellow-300 hover:shadow-md transition-all duration-200 group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <BookOpen size={18} className="text-yellow-600" />
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteDeck(deck._id); }}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3 className="font-bold text-black text-sm mb-1 line-clamp-2">{deck.deckName}</h3>
                <p className="text-gray-500 text-xs mb-3">{deck.subject}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">{deck.cards.length} cards</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    deck.sourceType === "pdf" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {deck.sourceType === "pdf" ? "📄 PDF" : "✏️ Prompt"}
                  </span>
                </div>

                <Button
                  onClick={() => setStudyDeck(deck)}
                  className="w-full h-9 btn-yellow border-0 font-semibold text-sm"
                >
                  Study Now →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
