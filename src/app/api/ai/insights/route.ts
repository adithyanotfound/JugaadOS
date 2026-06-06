import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSession } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analytics, classroomName, subject } = body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert educational analyst. Analyze the following classroom performance data for "${classroomName}" (Subject: ${subject}) and provide actionable insights.

Performance Data:
${JSON.stringify(analytics, null, 2)}

Provide a JSON response with exactly this structure (no markdown, just JSON):
{
  "studentsNeedingAttention": [
    {
      "name": "Student Name",
      "weakTopics": ["Topic 1", "Topic 2"],
      "avgScore": 45,
      "reason": "Brief explanation"
    }
  ],
  "revisionFocus": [
    {
      "topic": "Topic Name",
      "priority": "high" | "medium",
      "reason": "Why this needs revision"
    }
  ],
  "teachingStrategies": [
    {
      "topic": "Weakest Topic",
      "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
    }
  ],
  "summary": "2-3 sentence overall class performance summary"
}

Focus on: students below 50% average, topics with class-wide accuracy below 60%, and specific actionable teaching recommendations.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const insights = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights. Please try again." }, { status: 500 });
  }
}
