"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import SubmissionsPanel from "@/components/teacher/SubmissionsPanel";
import QuestionBankDrawer from "@/components/teacher/QuestionBankDrawer";
import { useWebLLM } from "@/lib/useWebLLM";
import WebLLMStatusBar from "@/components/ui/WebLLMStatusBar";

type QuestionType = "mcq" | "msq" | "truefalse" | "fillblank";

interface Question {
  _id?: string;
  type: QuestionType;
  stem: string;
  options?: string[];
  correctAnswer: string | string[];
  marks: number;
  topic: string;
  order: number;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  timeLimitMin: number;
  startAt: string;
  endAt: string;
  published: boolean;
  questions: Question[];
  classroomId: string;
}

function emptyQuestion(type: QuestionType, order: number): Question {
  return {
    type,
    stem: "",
    options: type === "mcq" || type === "msq" ? ["", "", "", ""] : undefined,
    correctAnswer: type === "msq" ? [] : type === "truefalse" ? "True" : "",
    marks: 1,
    topic: "",
    order,
  };
}

function SortableQuestion({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question._id || `q-${index}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateOption = (i: number, val: string) => {
    const opts = [...(question.options || [])];
    opts[i] = val;
    onChange({ ...question, options: opts });
  };

  const toggleMSQAnswer = (opt: string) => {
    const curr = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
    const next = curr.includes(opt) ? curr.filter(a => a !== opt) : [...curr, opt];
    onChange({ ...question, correctAnswer: next });
  };

  const typeLabel: Record<QuestionType, string> = {
    mcq: "MCQ", msq: "MSQ", truefalse: "True/False", fillblank: "Fill in Blank"
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Question Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <button className="drag-handle text-gray-300 hover:text-gray-500 text-xl leading-none select-none" {...attributes} {...listeners}>
          ⠿
        </button>
        <Badge className="bg-black text-yellow-400 border-0 text-xs font-semibold">{typeLabel[question.type]}</Badge>
        <span className="text-xs text-gray-400">Q{index + 1}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-400">Marks</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={question.marks}
            onChange={e => onChange({ ...question, marks: parseInt(e.target.value) || 1 })}
            className="w-16 h-7 text-xs"
          />
        </div>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 text-sm transition-colors ml-2">✕</button>
      </div>

      <div className="p-4 space-y-3">
        {/* Topic */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-500 w-12 flex-shrink-0">Topic</Label>
          <Input
            placeholder="e.g. Algebra, Photosynthesis"
            value={question.topic}
            onChange={e => onChange({ ...question, topic: e.target.value })}
            className="h-8 text-sm flex-1"
          />
        </div>

        {/* Question Stem */}
        <Textarea
          placeholder="Enter your question here..."
          value={question.stem}
          onChange={e => onChange({ ...question, stem: e.target.value })}
          className="resize-none text-sm"
          rows={2}
        />

        {/* Options for MCQ/MSQ */}
        {(question.type === "mcq" || question.type === "msq") && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Options {question.type === "msq" ? "(select all correct)" : "(select correct)"}</Label>
            {(question.options || ["", "", "", ""]).map((opt, oi) => {
              const label = ["A", "B", "C", "D"][oi];
              const isCorrect =
                question.type === "mcq"
                  ? question.correctAnswer === label
                  : Array.isArray(question.correctAnswer) && question.correctAnswer.includes(label);

              return (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (question.type === "mcq") onChange({ ...question, correctAnswer: label });
                      else toggleMSQAnswer(label);
                    }}
                    className={`w-6 h-6 rounded border flex-shrink-0 text-xs font-bold flex items-center justify-center transition-all ${
                      isCorrect ? "bg-black text-yellow-400 border-black" : "border-gray-300 text-gray-400 hover:border-black"
                    }`}
                  >
                    {label}
                  </button>
                  <Input
                    placeholder={`Option ${label}`}
                    value={opt}
                    onChange={e => updateOption(oi, e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* True/False */}
        {question.type === "truefalse" && (
          <div className="flex gap-3">
            {["True", "False"].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ ...question, correctAnswer: val })}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  question.correctAnswer === val ? "bg-black text-yellow-400 border-black" : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        )}

        {/* Fill in Blank */}
        {question.type === "fillblank" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Accepted Answer(s) — comma-separated for alternatives</Label>
            <Input
              placeholder="e.g. photosynthesis, Photosynthesis"
              value={Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer}
              onChange={e => onChange({
                ...question,
                correctAnswer: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
              })}
              className="h-9 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const classroomId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);

  // AI Generation State
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTypes, setAiTypes] = useState<QuestionType[]>(["mcq"]);
  const [aiCount, setAiCount] = useState(5);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<Question[]>([]);

  // WebLLM (local Gemma 2B)
  const { status: llmStatus, loadProgress: llmProgress, error: llmError, isWorking: llmBusy, generate: llmGenerate } = useWebLLM();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      const data = await res.json();
      if (!res.ok) { router.push(`/dashboard/teacher/classroom/${classroomId}`); return; }
      setQuiz(data.quiz);
      setQuestions(data.quiz.questions.sort((a: Question, b: Question) => a.order - b.order));
    } catch {
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }, [quizId, classroomId, router]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions(qs => {
        const oldIndex = qs.findIndex(q => (q._id || `q-${qs.indexOf(q)}`) === active.id);
        const newIndex = qs.findIndex(q => (q._id || `q-${qs.indexOf(q)}`) === over.id);
        return arrayMove(qs, oldIndex, newIndex).map((q, i) => ({ ...q, order: i }));
      });
    }
  };

  const addQuestion = (type: QuestionType) => {
    setQuestions(qs => {
      const newQ = emptyQuestion(type, qs.length);
      newQ._id = `new-${Date.now()}`;
      return [...qs, newQ];
    });
  };

  const saveQuiz = async (publish = false) => {
    // Validate questions
    for (const q of questions) {
      if (!q.stem.trim()) { toast.error("All questions must have a stem"); return; }
      if (!q.topic.trim()) { toast.error("All questions must have a topic"); return; }
      if (q.type === "mcq" || q.type === "msq") {
        if (!q.options?.every(o => o.trim())) { toast.error("All options must be filled"); return; }
        if (q.type === "mcq" && !q.correctAnswer) { toast.error("Select a correct answer for each MCQ"); return; }
        if (q.type === "msq" && (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0)) {
          toast.error("Select at least one correct answer for MSQ"); return;
        }
      }
    }

    setSaving(true);
    if (publish) setPublishing(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: questions.map((q, i) => ({ ...q, order: i })),
          ...(publish ? { published: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save"); return; }
      setQuiz(data.quiz);
      toast.success(publish ? "Quiz published! 🎉" : "Quiz saved!");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiTopic.trim()) { toast.error("Enter a topic"); return; }
    if (aiTypes.length === 0) { toast.error("Select at least one question type"); return; }

    const typeDescriptions: Record<string, string> = {
      mcq: "MCQ (single correct, 4 options labeled A/B/C/D)",
      msq: "MSQ (multiple select, 4 options, 1-3 correct, correctAnswer is array like ['A','C'])",
      truefalse: 'True/False (correctAnswer is exactly "True" or "False")',
      fillblank: "Fill in the blank with ___ in the stem (correctAnswer is array of accepted answers)",
    };
    const selectedTypes = aiTypes.map(t => typeDescriptions[t]).join("; ");

    const prompt = `Generate ${aiCount} quiz questions about the topic: "${aiTopic}".
Use these question types (distribute evenly): ${selectedTypes}.

Return ONLY a valid JSON array with no markdown and no extra text. Each object must have:
{
  "type": "mcq" | "msq" | "truefalse" | "fillblank",
  "stem": "the question text",
  "options": ["A option","B option","C option","D option"] (for mcq/msq only; omit for truefalse/fillblank),
  "correctAnswer": "A" for mcq, ["A","C"] for msq, "True" or "False" for truefalse, ["answer"] for fillblank,
  "marks": 1,
  "topic": "${aiTopic}"
}

JSON array only, no markdown fences:`;

    try {
      const text = await llmGenerate(prompt, { maxTokens: 2048, temperature: 0.4 });
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) { toast.error("Model did not return valid JSON — try again"); return; }
      const parsed = JSON.parse(jsonMatch[0]) as Question[];
      const withIds = parsed.map((q, i) => ({ ...q, _id: `ai-${Date.now()}-${i}`, order: i }));
      setAiGeneratedQuestions(withIds);
      toast.success(`Generated ${withIds.length} questions with Gemma 2B!`);
    } catch (err) {
      if (err instanceof Error && err.message.includes("JSON")) {
        toast.error("Could not parse model output — try again or simplify the topic");
      } else {
        toast.error("Generation failed");
      }
    }
  };

  const addAIQuestion = (q: Question) => {
    setQuestions(qs => [...qs, { ...q, _id: `ai-added-${Date.now()}`, order: qs.length }]);
    toast.success("Question added to quiz");
  };

  const addAllAIQuestions = () => {
    setQuestions(qs => [
      ...qs,
      ...aiGeneratedQuestions.map((q, i) => ({ ...q, _id: `ai-all-${Date.now()}-${i}`, order: qs.length + i })),
    ]);
    setAiGeneratedQuestions([]);
    setAiOpen(false);
    toast.success("All AI questions added!");
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/teacher/classroom/${classroomId}`)}
              className="text-gray-500 hover:text-black -ml-2 gap-1 text-sm"
            >
              ← Back
            </Button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-black text-sm leading-none truncate">{quiz.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{questions.length} questions · {totalMarks} total marks</p>
            </div>
            <div className="flex items-center gap-2">
              {quiz.published && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSubmissions(true)}
                  className="text-xs border-gray-200"
                >
                  📊 Submissions
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveQuiz(false)}
                disabled={saving}
                className="text-xs border-gray-200"
              >
                {saving && !publishing ? "Saving..." : "Save"}
              </Button>
              {!quiz.published && (
                <Button
                  className="btn-yellow border-0 font-semibold text-xs"
                  size="sm"
                  onClick={() => saveQuiz(true)}
                  disabled={publishing || questions.length === 0}
                >
                  {publishing ? "Publishing..." : "Publish Quiz"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Action Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-black flex-1">Add Questions</p>

          {/* Question Bank */}
          <QuestionBankDrawer onImport={(q) => {
            setQuestions(qs => [...qs, { ...q, _id: `bank-${Date.now()}`, order: qs.length, type: q.type as QuestionType }]);
          }} />

          {/* AI Generate */}
          <Sheet open={aiOpen} onOpenChange={setAiOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm" className="text-xs border-gray-200 gap-1">
                  ✨ Generate with AI
                </Button>
              }
            />
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-base font-bold">Generate with AI</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6 px-6">
                {/* WebLLM status indicator */}
                <WebLLMStatusBar
                  status={llmStatus}
                  progress={llmProgress}
                  error={llmError}
                />

                {llmStatus === "idle" && (
                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-xs font-semibold text-yellow-800 mb-0.5">🧠 Runs locally with Gemma 2B</p>
                    <p className="text-xs text-yellow-700 leading-snug">
                      Questions are generated on your device — no data sent to any server.
                      First use downloads ~1.5 GB (cached permanently).
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g. Photosynthesis, Quadratic Equations"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    className="h-11"
                    disabled={llmBusy}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["mcq", "msq", "truefalse", "fillblank"] as QuestionType[]).map(t => {
                      const labels = { mcq: "MCQ", msq: "MSQ (Multi-select)", truefalse: "True / False", fillblank: "Fill in Blank" };
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={llmBusy}
                          onClick={() => setAiTypes(prev =>
                            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                          )}
                          className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-left disabled:opacity-50 ${
                            aiTypes.includes(t) ? "bg-black text-yellow-400 border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {labels[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Number of Questions</Label>
                  <Input
                    type="number"
                    min={1}
                    max={15}
                    value={aiCount}
                    onChange={e => setAiCount(parseInt(e.target.value) || 5)}
                    className="h-11"
                    disabled={llmBusy}
                  />
                </div>
                <Button
                  onClick={generateWithAI}
                  disabled={llmBusy || aiTypes.length === 0}
                  className="w-full btn-yellow border-0 font-semibold"
                >
                  {llmBusy ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      {llmStatus === "downloading" ? "Downloading model…" :
                       llmStatus === "loading" ? "Loading model…" : "Generating…"}
                    </span>
                  ) : "Generate with Gemma 2B"}
                </Button>

                {aiGeneratedQuestions.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-black">{aiGeneratedQuestions.length} questions generated</p>
                      <Button size="sm" className="btn-yellow border-0 text-xs font-semibold" onClick={addAllAIQuestions}>
                        Add All
                      </Button>
                    </div>
                    {aiGeneratedQuestions.map((q, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className="bg-black text-yellow-400 border-0 text-xs">{q.type.toUpperCase()}</Badge>
                          <Button size="sm" variant="outline" className="text-xs h-6 px-2 border-gray-200" onClick={() => addAIQuestion(q)}>
                            + Add
                          </Button>
                        </div>
                        <p className="text-xs text-black font-medium mb-1">{q.stem}</p>
                        <p className="text-xs text-gray-400">Topic: {q.topic} · {q.marks} mark{q.marks !== 1 ? "s" : ""}</p>
                        {q.type === "mcq" && q.options && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt, oi) => {
                              const label = ["A", "B", "C", "D"][oi];
                              return (
                                <p key={oi} className={`text-xs ${q.correctAnswer === label ? "font-semibold text-green-700" : "text-gray-500"}`}>
                                  {label}. {opt}
                                </p>
                              );
                            })}
                          </div>
                        )}
                        {q.type === "truefalse" && (
                          <p className="text-xs mt-1 font-semibold text-green-700">Answer: {String(q.correctAnswer)}</p>
                        )}
                        {q.type === "fillblank" && (
                          <p className="text-xs mt-1 font-semibold text-green-700">
                            Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Add Question type buttons */}
          <div className="flex items-center gap-1">
            {(["mcq", "msq", "truefalse", "fillblank"] as QuestionType[]).map(t => {
              const labels = { mcq: "+ MCQ", msq: "+ MSQ", truefalse: "+ T/F", fillblank: "+ Fill" };
              return (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion(t)}
                  className="text-xs border-gray-200 hover:border-black hover:bg-black hover:text-yellow-400 transition-all"
                >
                  {labels[t]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Questions List with DnD */}
        {questions.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
            <span className="text-4xl mb-4 block">❓</span>
            <p className="text-gray-500 text-sm">No questions yet</p>
            <p className="text-xs text-gray-400 mt-1">Add questions using the buttons above or generate with AI</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q, i) => q._id || `q-${i}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <SortableQuestion
                    key={q._id || `q-${i}`}
                    question={q}
                    index={i}
                    onChange={updated => setQuestions(qs => qs.map((x, xi) => xi === i ? updated : x))}
                    onRemove={() => setQuestions(qs => qs.filter((_, xi) => xi !== i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Save Footer */}
        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">{questions.length} questions · {totalMarks} total marks</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => saveQuiz(false)} disabled={saving} className="border-gray-200">
                {saving && !publishing ? "Saving..." : "Save Draft"}
              </Button>
              {!quiz.published && (
                <Button className="btn-yellow border-0 font-semibold text-sm" onClick={() => saveQuiz(true)} disabled={publishing}>
                  {publishing ? "Publishing..." : "Publish Quiz"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submissions Sheet */}
      {showSubmissions && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end" onClick={() => setShowSubmissions(false)}>
          <div className="bg-white h-full w-full sm:max-w-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <SubmissionsPanel quizId={quizId} onClose={() => setShowSubmissions(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
