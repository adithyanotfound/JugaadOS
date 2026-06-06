import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IClassroom extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  joinCode: string;
  teacherId: mongoose.Types.ObjectId;
  studentIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    joinCode: { type: String, required: true, unique: true, uppercase: true, length: 6 },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Classroom = models.Classroom || model<IClassroom>("Classroom", ClassroomSchema);
export default Classroom;
