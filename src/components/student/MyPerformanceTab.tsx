"use client";

import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format } from "date-fns";

interface PerformanceData {
  performanceOverTime: Array<{
    quizId: string;
    quizTitle: string;
    startAt: string;
    score: number | null;
    totalMarks: number;
    pct: number | null;
  }>;
  topicAccuracy: Array<{
    topic: string;
    accuracy: number;
    correct: number;
    total: number;
  }>;
  strongest: Array<{ topic: string; accuracy: number }>;
  weakest: Array<{ topic: string; accuracy: number }>;
}

interface Props {
  classroomId: string;
}

export default function MyPerformanceTab({ classroomId }: Props) {
  const { data: performanceData, isLoading: loading } = useSWR<{ performance: PerformanceData }>(`/api/classrooms/${classroomId}/my-performance`);
  const data = performanceData?.performance ?? null;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  if (!data || data.performanceOverTime.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">📈</span>
        <p className="text-gray-500 text-sm">No quiz data yet</p>
        <p className="text-xs text-gray-400 mt-1">Take a quiz to see your performance here</p>
      </div>
    );
  }

  const lineData = data.performanceOverTime.map(q => ({
    name: q.quizTitle.substring(0, 15) + (q.quizTitle.length > 15 ? "…" : ""),
    score: q.pct,
    date: format(new Date(q.startAt), "MMM d"),
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-black">{data.performanceOverTime.length}</p>
            <p className="text-xs text-gray-500 mt-1">Quizzes Taken</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-black">
              {data.performanceOverTime.length > 0
                ? `${Math.round(data.performanceOverTime.reduce((s, q) => s + (q.pct || 0), 0) / data.performanceOverTime.length)}%`
                : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Avg Score</p>
          </CardContent>
        </Card>
        {data.strongest[0] && (
          <Card className="border border-green-100 bg-green-50/30 shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-bold text-green-700 line-clamp-1">{data.strongest[0].topic}</p>
              <p className="text-xs text-green-600">{data.strongest[0].accuracy}% accuracy</p>
              <p className="text-xs text-gray-500 mt-1">Best Topic</p>
            </CardContent>
          </Card>
        )}
        {data.weakest[0] && (
          <Card className="border border-yellow-100 bg-yellow-50/30 shadow-none">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-bold text-yellow-700 line-clamp-1">{data.weakest[0].topic}</p>
              <p className="text-xs text-yellow-600">{data.weakest[0].accuracy}% accuracy</p>
              <p className="text-xs text-gray-500 mt-1">Needs Work</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Score Over Time Line Chart */}
      <Card className="border border-gray-100 shadow-none">
        <CardContent className="p-6">
          <h3 className="font-bold text-black text-base mb-4">Score Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(val) => [`${val}%`, "Score"] as [string, string]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#FACC15"
                strokeWidth={3}
                dot={{ fill: "#FACC15", strokeWidth: 2, stroke: "#000", r: 5 }}
                activeDot={{ r: 7, stroke: "#000" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Topic Accuracy Bar Chart */}
      {data.topicAccuracy.length > 0 && (
        <Card className="border border-gray-100 shadow-none">
          <CardContent className="p-6">
            <h3 className="font-bold text-black text-base mb-4">Topic Accuracy</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.topicAccuracy}
                margin={{ top: 5, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="topic"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  formatter={(val) => [`${val}%`, "Accuracy"] as [string, string]}
                />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {data.topicAccuracy.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.accuracy < 50 ? "#FACC15" : entry.accuracy < 75 ? "#86efac" : "#16A34A"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 mt-2">Yellow bars = below 50% (focus areas)</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.strongest.length > 0 && (
          <Card className="border border-green-100 shadow-none bg-green-50/30">
            <CardContent className="p-5">
              <h3 className="font-bold text-green-700 text-sm mb-3">Strongest Topics</h3>
              <div className="space-y-2">
                {data.strongest.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-black font-medium">{t.topic}</span>
                    <span className="text-sm font-bold text-green-600">{t.accuracy}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {data.weakest.length > 0 && (
          <Card className="border border-yellow-100 shadow-none bg-yellow-50/30">
            <CardContent className="p-5">
              <h3 className="font-bold text-yellow-700 text-sm mb-3">Focus Areas</h3>
              <div className="space-y-2">
                {data.weakest.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-black font-medium">{t.topic}</span>
                    <span className="text-sm font-bold text-yellow-600">{t.accuracy}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
