import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ILostFound extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: "lost" | "found";
  postedBy: mongoose.Types.ObjectId;
  postedByName: string;
  postedByRole: "teacher" | "student";
  location: string;
  contactInfo: string;
  isResolved: boolean;
  createdAt: Date;
}

const LostFoundSchema = new Schema<ILostFound>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    type: { type: String, enum: ["lost", "found"], required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postedByName: { type: String, required: true },
    postedByRole: { type: String, enum: ["teacher", "student"], required: true },
    location: { type: String, trim: true, default: "" },
    contactInfo: { type: String, trim: true, default: "" },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LostFound = models.LostFound || model<ILostFound>("LostFound", LostFoundSchema);
export default LostFound;
