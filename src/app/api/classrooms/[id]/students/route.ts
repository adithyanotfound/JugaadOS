import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Classroom from "@/models/Classroom";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const classroom = await Classroom.findOne({ _id: id, teacherId: session.userId });
    if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

    const students = await User.find(
      { _id: { $in: classroom.studentIds } },
      { fullName: 1, grade: 1, username: 1, createdAt: 1 }
    );

    // Return with join date approximated as user creation date
    return NextResponse.json({ students });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
