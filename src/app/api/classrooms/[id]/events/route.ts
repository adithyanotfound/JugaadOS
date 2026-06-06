import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import CalendarEvent from "@/models/CalendarEvent";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(""),
  type: z.enum(["assignment", "test", "timetable", "datesheet", "holiday", "other"]),
  dueDate: z.string().datetime(),
});

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

    const isTeacher = session.role === "teacher" && classroom.teacherId.toString() === session.userId;
    const isStudent = session.role === "student" && classroom.studentIds.map(s => s.toString()).includes(session.userId);
    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const events = await CalendarEvent.find({ classroomId: id }).sort({ dueDate: 1 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const classroom = await Classroom.findOne({ _id: id, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const event = await CalendarEvent.create({
      ...parsed.data,
      classroomId: id,
      classroomName: classroom.name,
      subject: classroom.subject,
      dueDate: new Date(parsed.data.dueDate),
      createdBy: session.userId,
      createdByName: session.fullName,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    await dbConnect();
    const classroom = await Classroom.findOne({ _id: id, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    await CalendarEvent.findOneAndDelete({ _id: eventId, classroomId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
