import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Announcement from "@/models/Announcement";
import Classroom from "@/models/Classroom";
import CalendarEvent from "@/models/CalendarEvent";
import { getSession } from "@/lib/auth";

const CreateAnnouncementSchema = z.object({
  content: z.string().min(1, "Announcement content is required").max(2000),
  type: z.enum(["general", "assignment", "test"]).optional().default("general"),
  dueDate: z.string().optional(),
  attachmentName: z.string().optional(),
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

    const announcements = await Announcement.find({ classroomId: id }).sort({ createdAt: -1 });
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Get announcements error:", error);
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
    const parsed = CreateAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const classroom = await Classroom.findOne({ _id: id, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const announcementData: Record<string, unknown> = {
      classroomId: id,
      content: parsed.data.content,
      type: parsed.data.type,
      attachmentName: parsed.data.attachmentName,
    };

    if (parsed.data.dueDate) {
      announcementData.dueDate = new Date(parsed.data.dueDate);
    }

    const announcement = await Announcement.create(announcementData);

    // Auto-create a calendar event for assignments and tests
    if ((parsed.data.type === "assignment" || parsed.data.type === "test") && parsed.data.dueDate) {
      await CalendarEvent.create({
        classroomId: id,
        classroomName: classroom.name,
        subject: classroom.subject,
        title: `[${parsed.data.type === "assignment" ? "Assignment" : "Test"}] ${parsed.data.content.substring(0, 80)}${parsed.data.content.length > 80 ? "..." : ""}`,
        description: parsed.data.content,
        type: parsed.data.type,
        dueDate: new Date(parsed.data.dueDate),
        createdBy: session.userId,
        createdByName: session.fullName,
      });
    }

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
