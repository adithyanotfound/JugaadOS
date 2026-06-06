"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Send, Bot, User, Sparkles, BookOpen, X, Loader2, Brain } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  onGenerateFlashcards?: (pdfFile: File | null, context: string) => void;
}

const SUGGESTED_PROMPTS = [
  "📋 Summarize the key points from these notes",
  "💡 Explain the most important concepts",
  "❓ Quiz me on this material with 5 questions",
  "🔤 What are the key terms and their definitions?",
  "🗺️ Create a simple outline of the topics covered",
  "🤔 What might come in an exam from this material?",
];

export default function NotebookAI({ onGenerateFlashcards }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }
    setPdfFile(file);
    toast.success(`PDF loaded: ${file.name}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSend = async (prompt?: string) => {
    const message = (prompt || input).trim();
    if (!message) return;

    const userMessage: Message = { role: "user", content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("question", message);
      if (pdfFile) formData.append("pdf", pdfFile);
      // Only send last 6 messages as history to keep context manageable
      const historyToSend = messages.slice(-6);
      if (historyToSend.length > 0) {
        formData.append("history", JSON.stringify(historyToSend));
      }

      const res = await fetch("/api/ai/notebook", {
        method: "POST",
        body: formData,
      });

      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "AI failed to respond"); return; }

      setMessages(prev => [...prev, { role: "assistant", content: d.response }]);
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-5">
      {/* PDF Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 shadow-none cursor-pointer ${
          isDragging
            ? "border-yellow-400 bg-yellow-50"
            : pdfFile
            ? "border-green-300 bg-green-50"
            : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30"
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !pdfFile && fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {pdfFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-black text-sm">{pdfFile.name}</p>
                <p className="text-xs text-gray-500">{(pdfFile.size / (1024 * 1024)).toFixed(1)} MB · PDF loaded</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setPdfFile(null); setMessages([]); }}
                className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload size={22} className="text-yellow-500" />
              </div>
              <p className="font-semibold text-black text-sm mb-1">Upload your handwritten notes</p>
              <p className="text-xs text-gray-500">Drag & drop or click to upload a PDF (max 20MB)</p>
              <p className="text-xs text-gray-400 mt-1">You can also just type a question without uploading</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="border border-gray-100 shadow-none">
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-[420px] overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Brain size={26} className="text-black" />
                </div>
                <h3 className="font-bold text-black text-base mb-1">AI Teacher</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  {pdfFile
                    ? "Your notes are loaded! Ask me anything about them."
                    : "Upload your notes or just ask me any topic question."}
                </p>

                {/* Suggested prompts */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt.replace(/^[^\s]+\s/, ""))}
                      className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-yellow-50 hover:text-black border border-gray-200 hover:border-yellow-300 rounded-xl p-3 transition-all duration-200 line-clamp-2"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot size={14} className="text-black" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-black text-white rounded-tr-sm"
                          : "bg-gray-50 text-black rounded-tl-sm border border-gray-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <User size={14} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                      <Bot size={14} className="text-black" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Generate flashcards button - visible when PDF is loaded */}
          {pdfFile && messages.length > 0 && onGenerateFlashcards && (
            <div className="px-5 pb-3">
              <button
                onClick={() => onGenerateFlashcards(pdfFile, messages.map(m => m.content).join(" "))}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 hover:bg-yellow-100 transition-colors text-sm font-semibold text-yellow-700"
              >
                <Sparkles size={15} />
                Generate Flashcards from these Notes
              </button>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-4 flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              placeholder={pdfFile ? "Ask about your notes..." : "Ask any topic question..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20 text-sm"
              rows={1}
              disabled={sending}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="btn-yellow border-0 font-semibold shrink-0 h-11 w-11 p-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
