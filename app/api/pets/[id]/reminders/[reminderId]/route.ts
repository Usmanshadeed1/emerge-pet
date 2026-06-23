import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

async function getReminderAndVerify(reminderId: string, petId: string, userId: string) {
  const reminder = await db.reminder.findUnique({ where: { id: reminderId } });
  if (!reminder || reminder.petId !== petId) {
    return { reminder: null, error: "Reminder not found", status: 404 };
  }
  const pet = await db.pet.findUnique({ where: { id: petId } });
  if (!pet || pet.ownerId !== userId) {
    return { reminder: null, error: "Forbidden", status: 403 };
  }
  return { reminder, error: null, status: 200 };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; reminderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reminder, error, status } = await getReminderAndVerify(
    params.reminderId, params.id, session.user.id
  );
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const wasCompleted = reminder!.isCompleted;

    const updated = await db.reminder.update({
      where: { id: reminder!.id },
      data: {
        title:          body.title?.trim()   ?? reminder!.title,
        type:           body.type            ?? reminder!.type,
        dueDate:        body.dueDate         ? new Date(body.dueDate) : reminder!.dueDate,
        dueTime:        body.dueTime         ?? reminder!.dueTime,
        frequency:      body.frequency       ?? reminder!.frequency,
        reminderTimes:  Array.isArray(body.reminderTimes) ? body.reminderTimes.filter(Boolean) : reminder!.reminderTimes,
        notifyBefore:   body.notifyBefore != null ? Number(body.notifyBefore) : reminder!.notifyBefore,
        endDate:        body.endDate         ? new Date(body.endDate) : (body.endDate === null ? null : reminder!.endDate),
        notes:          body.notes?.trim()   ?? reminder!.notes,
        isCompleted:    body.isCompleted     ?? reminder!.isCompleted,
        completedAt:    body.isCompleted && !wasCompleted ? new Date() : reminder!.completedAt,
      },
    });

    // Award points when first marked complete
    if (body.isCompleted && !wasCompleted) {
      await awardPoints(session.user.id, "reminder_completed", 15);
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update reminder." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; reminderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reminder, error, status } = await getReminderAndVerify(
    params.reminderId, params.id, session.user.id
  );
  if (error) return NextResponse.json({ error }, { status });

  await db.reminder.delete({ where: { id: reminder!.id } });
  return NextResponse.json({ success: true });
}
