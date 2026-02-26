import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params;

  try {
    const notes = await db
      .select()
      .from(customerNotes)
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params;

  try {
    const body = await req.json();
    const { noteText, createdBy } = body;

    if (!noteText) {
      return NextResponse.json({ error: "noteText is required" }, { status: 400 });
    }

    const [note] = await db
      .insert(customerNotes)
      .values({
        customerId,
        noteText,
        createdBy: createdBy || "admin",
      })
      .returning();

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
