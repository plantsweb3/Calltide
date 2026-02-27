import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customerNotes, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const createNoteSchema = z.object({
  noteText: z.string().min(1, "noteText is required").max(5000),
  createdBy: z.string().max(100).default("admin"),
});

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
    // Validate customer exists
    const [customer] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.id, customerId))
      .limit(1);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const [note] = await db
      .insert(customerNotes)
      .values({
        customerId,
        noteText: parsed.data.noteText,
        createdBy: parsed.data.createdBy,
      })
      .returning();

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
