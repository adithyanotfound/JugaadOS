import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LostFound from "@/models/LostFound";
import { getSession } from "@/lib/auth";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const item = await LostFound.findById(id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    // Only poster or teacher can mark resolved
    const isOwner = item.postedBy.toString() === session.userId;
    const isTeacher = session.role === "teacher";
    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    item.isResolved = !item.isResolved;
    await item.save();

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Update lost-found error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const item = await LostFound.findById(id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const isOwner = item.postedBy.toString() === session.userId;
    const isTeacher = session.role === "teacher";
    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await item.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete lost-found error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
