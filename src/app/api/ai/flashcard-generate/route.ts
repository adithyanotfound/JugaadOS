import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { getSession } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const count = parseInt(formData.get("count") as string ?? "10");
    const subject = formData.get("subject") as string ?? "General";
    const pdfFile = formData.get("pdf") as File | null;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const parts: Part[] = [];

    if (pdfFile) {
      const buffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64,
        },
      });
    }

    const systemPrompt = `You are an expert educator creating flashcards for active recall learning.
${pdfFile ? "Analyze the provided PDF study material carefully." : ""}
Topic/Instructions from student: "${prompt}"
Subject: ${subject}

Generate exactly ${Math.min(Math.max(count, 3), 30)} high-quality flashcards for active recall.

Rules:
- Each card's "front" should be a clear, focused question or concept
- Each card's "back" should be a concise, accurate answer (2-4 sentences max)
- Cover key concepts, definitions, formulas, and important facts
- Make questions progressively test deeper understanding
- Avoid trivial or overly obvious questions

Respond ONLY with a valid JSON array in this exact format (no markdown, no explanation):
[
  {"front": "Question or concept here?", "back": "Clear answer here"},
  ...
]`;

    parts.push({ text: systemPrompt });

    const result = await model.generateContent(parts);
    const text = result.response.text().trim();

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const cards = JSON.parse(jsonMatch[0]) as Array<{ front: string; back: string }>;

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Flashcard generate error:", error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
