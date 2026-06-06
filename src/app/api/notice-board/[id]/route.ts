import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NoticeBoard from "@/models/NoticeBoard";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const notice = await NoticeBoard.findById(id);
    if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

    // Teacher can delete any; students can only delete their own
    const isOwner = notice.postedBy.toString() === session.userId;
    const isTeacher = session.role === "teacher";
    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await notice.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    await dbConnect();

    const notice = await NoticeBoard.findByIdAndUpdate(
      id,
      { isPinned: body.isPinned },
      { new: true }
    );
    if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

    return NextResponse.json({ notice });
  } catch (error) {
    console.error("Update notice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
