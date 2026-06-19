import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

async function getPetAndVerify(petId: string, userId: string) {
  const pet = await db.pet.findUnique({ where: { id: petId } });
  if (!pet)               return { pet: null, error: "Pet not found", status: 404 };
  if (pet.ownerId !== userId) return { pet: null, error: "Forbidden",   status: 403 };
  return { pet, error: null, status: 200 };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  const reminders = await db.reminder.findMany({
    where:   { petId: pet!.id },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(reminders);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { title, type, dueDate, dueTime, frequency, notes } = await req.json();

    if (!title?.trim() || !type || !dueDate) {
      return NextResponse.json({ error: "Title, type, and due date are required." }, { status: 400 });
    }

    const reminder = await db.reminder.create({
      data: {
        petId:     pet!.id,
        title:     title.trim(),
        type,
        dueDate:   new Date(dueDate),
        dueTime:   dueTime   || null,
        frequency: frequency || null,
        notes:     notes?.trim() || null,
      },
    });

    await awardPoints(session.user.id, "reminder_created", 5);

    return NextResponse.json(reminder, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create reminder." }, { status: 500 });
  }
}
