import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";

const TeacherSignupSchema = z.object({
  role: z.literal("teacher"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const StudentSignupSchema = z.object({
  role: z.literal("student"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers and underscores"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  grade: z.string().min(1, "Grade/class is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignupSchema = z.discriminatedUnion("role", [TeacherSignupSchema, StudentSignupSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const data = parsed.data;

    // Check for existing user
    if (data.role === "teacher") {
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
    } else {
      const existing = await User.findOne({ username: data.username.toLowerCase() });
      if (existing) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      role: data.role,
      fullName: data.fullName,
      passwordHash,
      ...(data.role === "teacher" ? { email: data.email.toLowerCase() } : {}),
      ...(data.role === "student" ? { username: data.username.toLowerCase(), grade: data.grade } : {}),
    });

    await setSessionCookie({
      userId: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
