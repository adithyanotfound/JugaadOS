import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CalendarEvent from "@/models/CalendarEvent";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

// GET /api/events — aggregated events for a student across all enrolled classrooms
// or for a teacher across all their classrooms
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    let classroomIds: string[] = [];

    if (session.role === "student") {
      const classrooms = await Classroom.find({
        studentIds: session.userId,
      }).select("_id");
      classroomIds = classrooms.map(c => c._id.toString());
    } else {
      const classrooms = await Classroom.find({
        teacherId: session.userId,
      }).select("_id");
      classroomIds = classrooms.map(c => c._id.toString());
    }

    const events = await CalendarEvent.find({
      classroomId: { $in: classroomIds },
    }).sort({ dueDate: 1 });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get all events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
