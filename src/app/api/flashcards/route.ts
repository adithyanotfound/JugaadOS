import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import FlashcardDeck from "@/models/FlashcardDeck";
import { getSession } from "@/lib/auth";

const CreateSchema = z.object({
  deckName: z.string().min(1).max(150),
  subject: z.string().max(100).optional().default("General"),
  cards: z.array(z.object({ front: z.string().min(1), back: z.string().min(1) })).min(1).max(100),
  sourceType: z.enum(["pdf", "prompt"]),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const decks = await FlashcardDeck.find({ studentId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ decks });
  } catch (error) {
    console.error("Get flashcards error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const deck = await FlashcardDeck.create({
      ...parsed.data,
      studentId: session.userId,
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("Create flashcard deck error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
