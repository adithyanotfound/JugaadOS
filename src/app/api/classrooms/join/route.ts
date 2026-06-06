import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

const JoinSchema = z.object({
  code: z.string().length(6, "Join code must be 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const classroom = await Classroom.findOne({ joinCode: parsed.data.code.toUpperCase() });
    if (!classroom) {
      return NextResponse.json({ error: "Invalid join code. Please check and try again." }, { status: 404 });
    }

    if (classroom.studentIds.map(s => s.toString()).includes(session.userId)) {
      return NextResponse.json({ error: "You have already joined this classroom" }, { status: 409 });
    }

    await Classroom.findByIdAndUpdate(classroom._id, {
      $push: { studentIds: session.userId },
    });

    return NextResponse.json({ classroom, message: "Joined classroom successfully" });
  } catch (error) {
    console.error("Join classroom error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get student's classrooms
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const classrooms = await Classroom.find({ studentIds: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json({ classrooms });
  } catch (error) {
    console.error("Get student classrooms error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
