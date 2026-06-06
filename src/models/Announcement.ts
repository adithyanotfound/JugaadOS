import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  content: string;
  type: "general" | "assignment" | "test";
  dueDate?: Date;
  attachmentName?: string;
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["general", "assignment", "test"],
      default: "general",
    },
    dueDate: { type: Date },
    attachmentName: { type: String },
  },
  { timestamps: true }
);

const Announcement = models.Announcement || model<IAnnouncement>("Announcement", AnnouncementSchema);
export default Announcement;
