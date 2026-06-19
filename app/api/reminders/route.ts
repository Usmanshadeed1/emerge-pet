import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Returns all reminders across all of the user's pets (for calendar view)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pets = await db.pet.findMany({
    where:  { ownerId: session.user.id },
    select: { id: true, name: true, species: true },
  });

  const petIds = pets.map((p) => p.id);

  const reminders = await db.reminder.findMany({
    where:   { petId: { in: petIds } },
    orderBy: { dueDate: "asc" },
  });

  const petMap = Object.fromEntries(pets.map((p) => [p.id, p]));

  const enriched = reminders.map((r) => ({
    ...r,
    pet: petMap[r.petId] ?? null,
  }));

  return NextResponse.json(enriched);
}
