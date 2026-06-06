import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Classroom from "@/models/Classroom";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, studentId } = await params;
    await dbConnect();

    const classroom = await Classroom.findOneAndUpdate(
      { _id: id, teacherId: session.userId },
      { $pull: { studentIds: studentId } },
      { new: true }
    );

    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    return NextResponse.json({ message: "Student removed successfully" });
  } catch (error) {
    console.error("Remove student error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
