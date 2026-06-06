import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  role: "teacher" | "student";
  email?: string;
  username?: string;
  fullName: string;
  grade?: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ["teacher", "student"], required: true },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, required: true, trim: true },
    grade: { type: String, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;
