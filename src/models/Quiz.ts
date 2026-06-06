import mongoose, { Schema, Document, model, models } from "mongoose";

export type QuestionType = "mcq" | "msq" | "truefalse" | "fillblank";

export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  type: QuestionType;
  stem: string;
  options?: string[];
  correctAnswer: string | string[]; // string for mcq/truefalse/fillblank, string[] for msq or fillblank alternates
  marks: number;
  topic: string;
  order: number;
}

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  timeLimitMin: number;
  startAt: Date;
  endAt: Date;
  questions: IQuestion[];
  published: boolean;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  type: { type: String, enum: ["mcq", "msq", "truefalse", "fillblank"], required: true },
  stem: { type: String, required: true, trim: true },
  options: [{ type: String }],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  marks: { type: Number, required: true, min: 1 },
  topic: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
});

const QuizSchema = new Schema<IQuiz>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    timeLimitMin: { type: Number, required: true, min: 1 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    questions: [QuestionSchema],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Quiz = models.Quiz || model<IQuiz>("Quiz", QuizSchema);
export default Quiz;
