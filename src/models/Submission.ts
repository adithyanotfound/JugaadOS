import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  answer: string | string[];
  isCorrect: boolean;
  marksEarned: number;
}

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  totalMarks: number;
  timeTakenSec: number;
  submittedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: Schema.Types.ObjectId, required: true },
  answer: { type: Schema.Types.Mixed },
  isCorrect: { type: Boolean, required: true },
  marksEarned: { type: Number, required: true, default: 0 },
});

const SubmissionSchema = new Schema<ISubmission>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    answers: [AnswerSchema],
    score: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true },
    timeTakenSec: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One submission per student per quiz
SubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

const Submission = models.Submission || model<ISubmission>("Submission", SubmissionSchema);
export default Submission;
