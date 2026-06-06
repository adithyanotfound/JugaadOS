import mongoose, { Schema, Document, model, models } from "mongoose";
import { IQuestion } from "./Quiz";

export interface IQuestionBank extends Document {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  question: IQuestion;
  subject: string;
  topic: string;
  createdAt: Date;
}

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: {
      type: { type: String, enum: ["mcq", "msq", "truefalse", "fillblank"], required: true },
      stem: { type: String, required: true, trim: true },
      options: [{ type: String }],
      correctAnswer: { type: Schema.Types.Mixed, required: true },
      marks: { type: Number, required: true, min: 1 },
      topic: { type: String, required: true, trim: true },
      order: { type: Number, default: 0 },
    },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

QuestionBankSchema.index({ teacherId: 1, subject: 1, topic: 1 });

const QuestionBank = models.QuestionBank || model<IQuestionBank>("QuestionBank", QuestionBankSchema);
export default QuestionBank;
