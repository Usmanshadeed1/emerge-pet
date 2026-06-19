import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public route — no auth required
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const link = await db.sitterAccess.findUnique({
    where:  { token: params.token },
    select: {
      id:        true,
      isActive:  true,
      expiresAt: true,
      petIds:    true,
      label:     true,
    },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found.", expired: true }, { status: 404 });
  }

  const isExpired = !link.isActive || link.expiresAt < new Date();
  if (isExpired) {
    return NextResponse.json({ error: "This link has expired.", expired: true }, { status: 410 });
  }

  const now       = new Date();
  const in7Days   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch allowed pets with profiles, photos, upcoming reminders and most recent record
  const pets = await db.pet.findMany({
    where:  { id: { in: link.petIds } },
    select: {
      id:           true,
      name:         true,
      species:      true,
      breed:        true,
      dateOfBirth:  true,
      weight:       true,
      weightUnit:   true,
      color:        true,
      sex:          true,
      isNeutered:   true,
      specialNotes: true,
      photoData:    true,
      reminders: {
        where:   { isCompleted: false, dueDate: { gte: now, lte: in7Days } },
        orderBy: { dueDate: "asc" },
        select:  { id: true, title: true, type: true, dueDate: true, notes: true },
      },
      healthRecords: {
        orderBy: { date: "desc" },
        take:    1,
        select:  {
          id:     true,
          type:   true,
          title:  true,
          date:   true,
          vetName: true,
          notes:  true,
        },
      },
    },
  });

  // Preserve petIds order and strip photoData (serve via API route instead)
  const ordered = link.petIds
    .map((id) => pets.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map(({ photoData, ...pet }) => ({ ...pet, hasPhoto: !!photoData }));

  return NextResponse.json({
    label:     link.label,
    expiresAt: link.expiresAt,
    pets:      ordered,
  });
}
