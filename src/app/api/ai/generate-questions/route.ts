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
    const { topic, questionTypes, count } = body;

    if (!topic || !questionTypes || !count) {
      return NextResponse.json({ error: "Topic, question types, and count are required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const typeDescriptions: Record<string, string> = {
      mcq: "MCQ (single correct, 4 options)",
      msq: "MSQ (multiple select, 4 options, 1-3 correct)",
      truefalse: "True/False statement",
      fillblank: "Fill in the blank (provide 1-3 accepted answers)",
    };

    const selectedTypes = questionTypes.map((t: string) => typeDescriptions[t] || t).join(", ");

    const prompt = `Generate ${count} quiz questions about the topic: "${topic}".
Use these question types (distribute evenly): ${selectedTypes}.

Return a valid JSON array (no markdown, no explanation, just the JSON array) with exactly ${count} questions.
Each question object must have these exact fields:
{
  "type": "mcq" | "msq" | "truefalse" | "fillblank",
  "stem": "The question text",
  "options": ["A", "B", "C", "D"] (for mcq/msq; omit for truefalse/fillblank),
  "correctAnswer": "A" for mcq, ["A","C"] for msq, "True"/"False" for truefalse, ["answer1","alt2"] for fillblank,
  "marks": 1-5 (integer based on difficulty),
  "topic": "specific sub-topic tag (e.g. 'Algebra', 'Photosynthesis')"
}

Make questions educational, clear, and varied in difficulty. For fillblank, write the sentence with ___ where the blank is.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const questions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("AI generate questions error:", error);
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 });
  }
}
