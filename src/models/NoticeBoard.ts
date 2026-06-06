import mongoose, { Schema, Document, model, models } from "mongoose";

export interface INoticeBoard extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: "club" | "academic" | "general" | "event";
  postedBy: mongoose.Types.ObjectId;
  postedByName: string;
  postedByRole: "teacher" | "student";
  isPinned: boolean;
  createdAt: Date;
}

const NoticeBoardSchema = new Schema<INoticeBoard>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    category: {
      type: String,
      enum: ["club", "academic", "general", "event"],
      required: true,
      default: "general",
    },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postedByName: { type: String, required: true },
    postedByRole: { type: String, enum: ["teacher", "student"], required: true },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const NoticeBoard = models.NoticeBoard || model<INoticeBoard>("NoticeBoard", NoticeBoardSchema);
export default NoticeBoard;
