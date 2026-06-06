import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Classroom from "@/models/Classroom";
import { getSession, generateJoinCode } from "@/lib/auth";

const CreateClassroomSchema = z.object({
  name: z.string().min(1, "Classroom name is required").max(100),
  subject: z.string().min(1, "Subject is required").max(100),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const classrooms = await Classroom.find({ teacherId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ classrooms });
  } catch (error) {
    console.error("Get classrooms error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateClassroomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate unique join code
    let joinCode = generateJoinCode();
    let attempts = 0;
    while (await Classroom.findOne({ joinCode }) && attempts < 10) {
      joinCode = generateJoinCode();
      attempts++;
    }

    const classroom = await Classroom.create({
      name: parsed.data.name,
      subject: parsed.data.subject,
      joinCode,
      teacherId: session.userId,
      studentIds: [],
    });

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error("Create classroom error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
