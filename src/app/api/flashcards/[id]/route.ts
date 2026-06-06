import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FlashcardDeck from "@/models/FlashcardDeck";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const deck = await FlashcardDeck.findOne({ _id: id, studentId: session.userId });
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    await deck.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete flashcard deck error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
