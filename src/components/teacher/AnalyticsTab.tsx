"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { BarChart2, TrendingUp, AlertTriangle, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebLLM } from "@/lib/useWebLLM";
import WebLLMStatusBar from "@/components/ui/WebLLMStatusBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Analytics {
  completionRates: Array<{
    quizId: string;
    quizTitle: string;
    submitted: number;
    total: number;
    rate: number;
  }>;
  scoreDistribution: Array<{
    quizId: string;
    quizTitle: string;
    buckets: Record<string, number>;
  }>;
  perStudentScores: Array<{
    studentId: string;
    fullName: string;
    grade?: string;
    quizScores: Array<{ quizId: string; quizTitle: string; pct: number | null }>;
    avg: number | null;
  }>;
  topics: string[];
  topicHeatmap: Array<{
    studentId: string;
    fullName: string;
    topicAccuracy: Record<string, { correct: number; total: number } | null>;
  }>;
  questionDifficulty: Array<{
    quizId: string;
    quizTitle: string;
    stats: Array<{ stem: string; topic: string; incorrectPct: number; total: number }>;
  }>;
  students: Array<{ _id: string; fullName: string; grade?: string }>;
  quizzes: Array<{ _id: string; title: string }>;
}

interface AIInsights {
  studentsNeedingAttention: Array<{ name: string; weakTopics: string[]; avgScore: number; reason: string }>;
  revisionFocus: Array<{ topic: string; priority: string; reason: string }>;
  teachingStrategies: Array<{ topic: string; strategies: string[] }>;
  summary: string;
}

interface Props {
  classroomId: string;
  classroomName: string;
  subject: string;
}

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#FACC15"
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" className="text-xs font-bold fill-black" fontSize={12}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function getScoreColor(pct: number | null) {
  if (pct === null) return "text-gray-300";
  if (pct < 50) return "score-red";
  if (pct < 75) return "score-yellow";
  return "score-green";
}

function getScoreBg(pct: number | null) {
  if (pct === null) return "bg-gray-50 text-gray-300";
  if (pct < 50) return "bg-red-50 text-red-600 font-semibold";
  if (pct < 75) return "bg-yellow-50 text-yellow-700 font-semibold";
  return "bg-green-50 text-green-700 font-semibold";
}

function getHeatColor(accuracy: { correct: number; total: number } | null) {
  if (!accuracy) return "bg-gray-50 text-gray-300";
  const pct = (accuracy.correct / accuracy.total) * 100;
  if (pct < 30) return "bg-amber-400 text-white";
  if (pct < 50) return "bg-yellow-200 text-yellow-900";
  return "bg-green-50 text-green-700";
}

function getHeatPct(accuracy: { correct: number; total: number } | null) {
  if (!accuracy) return "—";
  return `${Math.round((accuracy.correct / accuracy.total) * 100)}%`;
}

export default function AnalyticsTab({ classroomId, classroomName, subject }: Props) {
  const { data: analyticsData, isLoading: loading } = useSWR<{ analytics: Analytics }>(
    `/api/classrooms/${classroomId}/analytics`
  );
  const analytics = analyticsData?.analytics ?? null;
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "avg">("avg");

  // Local LLM for insights
  const { status: llmStatus, loadProgress: llmProgress, error: llmError, isWorking: llmBusy, generate: llmGenerate } = useWebLLM();

  const fetchInsights = async () => {
    if (!analytics) return;
    setLoadingInsights(true);

    const prompt = `You are an expert educational analyst. Analyze this classroom performance data for "${classroomName}" (Subject: ${subject}) and provide actionable insights.

Performance Data:
${JSON.stringify(analytics, null, 2)}

Respond ONLY with a JSON object (no markdown, no explanation). Use this exact structure:
{
  "studentsNeedingAttention": [
    { "name": "Student Name", "weakTopics": ["Topic"], "avgScore": 45, "reason": "Brief explanation" }
  ],
  "revisionFocus": [
    { "topic": "Topic Name", "priority": "high", "reason": "Why this needs revision" }
  ],
  "teachingStrategies": [
    { "topic": "Weakest Topic", "strategies": ["Strategy 1", "Strategy 2"] }
  ],
  "summary": "2-3 sentence class performance summary"
}

Focus on students below 50% average and topics with accuracy below 60%. JSON only:`;

    try {
      const text = await llmGenerate(prompt, { maxTokens: 1500, temperature: 0.5 });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { toast.error("Model did not return valid JSON — try again"); return; }
      const parsed = JSON.parse(jsonMatch[0]) as AIInsights;
      setInsights(parsed);
      toast.success("Insights generated with Gemma 2B!");
    } catch (err) {
      if (err instanceof Error && err.message.includes("JSON")) {
        toast.error("Could not parse model output — try again");
      } else {
        toast.error("Generation failed");
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
            <div className="h-32 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!analytics || analytics.students.length === 0) {
    return (
      <div className="text-center py-16">
        <BarChart2 size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No data yet. Add students and quizzes to see analytics.</p>
      </div>
    );
  }

  const sortedStudents = [...analytics.perStudentScores].sort((a, b) => {
    if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    return b.avg - a.avg;
  });

  return (
    <div className="space-y-6">

      {/* 1. Quiz Completion Rate */}
      <Card className="border border-gray-100 shadow-none">
        <CardContent className="p-6">
          <h3 className="font-bold text-black mb-4 text-base">Quiz Completion Rate</h3>
          {analytics.completionRates.length === 0 ? (
            <p className="text-sm text-gray-400">No quizzes yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {analytics.completionRates.map(cr => (
                <div key={cr.quizId} className="flex flex-col items-center gap-2">
                  <ProgressRing pct={cr.rate} size={80} />
                  <p className="text-xs text-center text-gray-600 font-medium line-clamp-2">{cr.quizTitle}</p>
                  <p className="text-xs text-gray-400">{cr.submitted}/{cr.total} students</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Score Distribution */}
      <Card className="border border-gray-100 shadow-none">
        <CardContent className="p-6">
          <h3 className="font-bold text-black mb-4 text-base">Score Distribution</h3>
          {analytics.scoreDistribution.length === 0 ? (
            <p className="text-sm text-gray-400">No submissions yet</p>
          ) : (
            <div className="space-y-8">
              {analytics.scoreDistribution.map(sd => {
                const chartData = Object.entries(sd.buckets).map(([range, count]) => ({ range, count }));
                return (
                  <div key={sd.quizId}>
                    <p className="text-sm font-semibold text-black mb-3">{sd.quizTitle}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          formatter={(val) => [`${val} students`, "Count"] as [string, string]}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, idx) => (
                            <Cell key={idx} fill={idx === 3 ? "#FACC15" : idx === 2 ? "#d1fae5" : idx === 1 ? "#fef9c3" : "#fee2e2"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Per-Student Score Table */}
      <Card className="border border-gray-100 shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-black text-base">Student Scores</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${sortBy === "name" ? "bg-yellow-50 text-black font-semibold" : "text-gray-500"}`}
                onClick={() => setSortBy("name")}
              >
                Sort by Name
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${sortBy === "avg" ? "bg-yellow-50 text-black font-semibold" : "text-gray-500"}`}
                onClick={() => setSortBy("avg")}
              >
                Sort by Avg
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Student</th>
                  {analytics.quizzes.map(q => (
                    <th key={q._id} className="text-center py-2 px-2 text-xs text-gray-500 font-medium max-w-[80px]">
                      <span className="line-clamp-1 block" title={q.title}>{q.title.substring(0, 12)}{q.title.length > 12 ? "…" : ""}</span>
                    </th>
                  ))}
                  <th className="text-center py-2 px-3 text-xs text-gray-500 font-medium">Avg</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map(student => (
                  <tr key={student.studentId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-black text-xs">{student.fullName}</p>
                      {student.grade && <p className="text-xs text-gray-400">{student.grade}</p>}
                    </td>
                    {student.quizScores.map(qs => (
                      <td key={qs.quizId} className="text-center py-2.5 px-2">
                        <span className={`text-xs px-2 py-1 rounded-md ${getScoreBg(qs.pct)}`}>
                          {qs.pct !== null ? `${qs.pct}%` : "—"}
                        </span>
                      </td>
                    ))}
                    <td className="text-center py-2.5 px-3">
                      <span className={`text-xs font-bold ${getScoreColor(student.avg)}`}>
                        {student.avg !== null ? `${student.avg}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Topic Weakness Heatmap */}
      {analytics.topics.length > 0 && (
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-6">
            <h3 className="font-bold text-black mb-1 text-base">Topic Weakness Heatmap</h3>
            <p className="text-xs text-gray-400 mb-4">Accuracy per topic per student. Yellow = weak, amber = very weak.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[300px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Student</th>
                    {analytics.topics.map(t => (
                      <th key={t} className="text-center py-2 px-2 text-gray-500 font-medium max-w-[80px]">
                        <span className="line-clamp-1 block" title={t}>{t.substring(0, 12)}{t.length > 12 ? "…" : ""}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.topicHeatmap.map(row => (
                    <tr key={row.studentId} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-medium text-black">{row.fullName}</td>
                      {analytics.topics.map(topic => (
                        <td key={topic} className="text-center py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${getHeatColor(row.topicAccuracy[topic])}`}>
                            {getHeatPct(row.topicAccuracy[topic])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Question Difficulty Stats */}
      {analytics.questionDifficulty.some(qd => qd.stats.length > 0) && (
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-6">
            <h3 className="font-bold text-black mb-4 text-base">Question Difficulty</h3>
            <p className="text-xs text-gray-400 mb-4">Questions ranked by % of students who got them wrong.</p>
            <div className="space-y-6">
              {analytics.questionDifficulty.map(qd => (
                qd.stats.length > 0 && (
                  <div key={qd.quizId}>
                    <p className="text-sm font-semibold text-black mb-3">{qd.quizTitle}</p>
                    <div className="space-y-2">
                      {qd.stats.slice(0, 5).map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 truncate">{stat.stem}...</p>
                            <p className="text-xs text-gray-400">{stat.topic}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full transition-all"
                                style={{ width: `${stat.incorrectPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-black w-10 text-right">{stat.incorrectPct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. AI Insights */}
      <Card className="border border-yellow-200 shadow-none bg-yellow-50/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-black text-base flex items-center gap-2"><TrendingUp size={16} /> AI Insights</h3>
              <p className="text-xs text-gray-500 mt-0.5">Powered by Gemma 2B — runs locally on your device</p>
            </div>
            <Button
              onClick={fetchInsights}
              disabled={llmBusy || loadingInsights}
              className="btn-yellow border-0 font-semibold text-sm"
            >
              {(llmBusy || loadingInsights) ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  {llmStatus === "downloading" ? "Downloading model…" :
                   llmStatus === "loading" ? "Loading model…" : "Analyzing…"}
                </span>
              ) : insights ? "Refresh Insights" : "Generate Insights"}
            </Button>
          </div>

          {/* WebLLM progress bar */}
          {(llmStatus !== "idle" || llmBusy) && (
            <div className="mb-4">
              <WebLLMStatusBar
                status={llmStatus}
                progress={llmProgress}
                error={llmError}
                compact
              />
            </div>
          )}

          {/* First-time info when idle */}
          {llmStatus === "idle" && !insights && (
            <div className="rounded-xl bg-white border border-yellow-100 p-3 mb-4">
              <p className="text-xs text-gray-600 leading-snug">
                🧠 <strong>Runs entirely on your device</strong> using Gemma 2B via WebGPU.
                First use downloads ~1.5 GB (cached permanently). No data leaves your machine.
              </p>
            </div>
          )}

          {insights && (
            <div className="space-y-5 mt-4">
              {/* Summary */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
              </div>

              {/* Students needing attention */}
              {insights.studentsNeedingAttention?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-black text-sm mb-3 flex items-center gap-1.5"><AlertTriangle size={13} className="text-red-500" /> Students Needing Attention</h4>
                  <div className="space-y-2">
                    {insights.studentsNeedingAttention.map((s, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-black">{s.name}</span>
                          <span className="text-xs text-red-500 font-semibold">Avg: {s.avgScore}%</span>
                        </div>
                        <p className="text-xs text-gray-500">{s.reason}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.weakTopics?.map((t, ti) => (
                            <span key={ti} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revision focus */}
              {insights.revisionFocus?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-black text-sm mb-3 flex items-center gap-1.5"><BookOpen size={13} /> Revision Focus This Week</h4>
                  <div className="space-y-2">
                    {insights.revisionFocus.map((rf, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 flex items-start gap-3">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${rf.priority === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {rf.priority.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-black">{rf.topic}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{rf.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teaching strategies */}
              {insights.teachingStrategies?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-black text-sm mb-3 flex items-center gap-1.5"><Lightbulb size={13} /> Teaching Strategies</h4>
                  <div className="space-y-3">
                    {insights.teachingStrategies.map((ts, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 border border-gray-100">
                        <p className="font-semibold text-sm text-black mb-2">{ts.topic}</p>
                        <ul className="space-y-1">
                          {ts.strategies?.map((s, si) => (
                            <li key={si} className="text-xs text-gray-600 flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
