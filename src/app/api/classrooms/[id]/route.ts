import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const classroom = await Classroom.findById(id);
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    // Teacher or enrolled student can access
    const isTeacher = session.role === "teacher" && classroom.teacherId.toString() === session.userId;
    const isStudent = session.role === "student" && classroom.studentIds.map(s => s.toString()).includes(session.userId);

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error("Get classroom error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
