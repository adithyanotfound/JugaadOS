import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ICalendarEvent extends Document {
  _id: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  classroomName: string;
  subject: string;
  title: string;
  description: string;
  type: "assignment" | "test" | "timetable" | "datesheet" | "holiday" | "other";
  dueDate: Date;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    classroomName: { type: String, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["assignment", "test", "timetable", "datesheet", "holiday", "other"],
      required: true,
    },
    dueDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

const CalendarEvent = models.CalendarEvent || model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);
export default CalendarEvent;
