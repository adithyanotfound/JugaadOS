import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import LostFound from "@/models/LostFound";
import { getSession } from "@/lib/auth";

const CreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  type: z.enum(["lost", "found"]),
  location: z.string().max(200).optional().default(""),
  contactInfo: z.string().max(200).optional().default(""),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const items = await LostFound.find({}).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get lost-found error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const item = await LostFound.create({
      ...parsed.data,
      postedBy: session.userId,
      postedByName: session.fullName,
      postedByRole: session.role,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Create lost-found error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
