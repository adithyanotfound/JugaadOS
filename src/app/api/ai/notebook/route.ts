import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { getSession } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const question = formData.get("question") as string;
    const pdfFile = formData.get("pdf") as File | null;
    const history = formData.get("history") as string | null;

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const parts: Part[] = [];

    // If PDF is attached, include it as inline data
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

    // Build conversation context from history
    let contextPrompt = "";
    if (history) {
      try {
        const parsedHistory = JSON.parse(history) as Array<{ role: string; content: string }>;
        contextPrompt = parsedHistory
          .map(h => `${h.role === "user" ? "Student" : "Teacher"}: ${h.content}`)
          .join("\n");
      } catch {
        // ignore parse errors
      }
    }

    const systemPrompt = `You are an expert AI teacher helping a student understand their study material. 
You are knowledgeable, patient, encouraging, and clear in your explanations.
${pdfFile ? "The student has shared their handwritten notes or study material as a PDF. Analyze it carefully and help them understand the content." : ""}
${contextPrompt ? `\nPrevious conversation:\n${contextPrompt}\n` : ""}
Always explain concepts clearly, use examples when helpful, and encourage the student.
If asked to quiz the student, create thoughtful questions based on the material.
Respond in a warm, teacher-like tone.

Student's question: ${question}`;

    parts.push({ text: systemPrompt });

    const result = await model.generateContent(parts);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Notebook AI error:", error);
    return NextResponse.json({ error: "AI processing failed" }, { status: 500 });
  }
}
