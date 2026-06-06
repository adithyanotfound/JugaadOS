import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IFlashcard {
  front: string;
  back: string;
}

export interface IFlashcardDeck extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  deckName: string;
  subject: string;
  cards: IFlashcard[];
  sourceType: "pdf" | "prompt";
  createdAt: Date;
}

const FlashcardSchema = new Schema<IFlashcardDeck>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deckName: { type: String, required: true, trim: true, maxlength: 150 },
    subject: { type: String, trim: true, default: "General" },
    cards: [
      {
        front: { type: String, required: true },
        back: { type: String, required: true },
      },
    ],
    sourceType: { type: String, enum: ["pdf", "prompt"], required: true },
  },
  { timestamps: true }
);

const FlashcardDeck = models.FlashcardDeck || model<IFlashcardDeck>("FlashcardDeck", FlashcardSchema);
export default FlashcardDeck;
