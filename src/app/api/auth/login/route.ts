import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";

const TeacherLoginSchema = z.object({
  role: z.literal("teacher"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const StudentLoginSchema = z.object({
  role: z.literal("student"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const LoginSchema = z.discriminatedUnion("role", [TeacherLoginSchema, StudentLoginSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const data = parsed.data;

    let user;
    if (data.role === "teacher") {
      user = await User.findOne({ email: data.email.toLowerCase(), role: "teacher" });
    } else {
      user = await User.findOne({ username: data.username.toLowerCase(), role: "student" });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSessionCookie({
      userId: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
