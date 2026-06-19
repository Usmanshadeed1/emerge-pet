import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardPoints } from "@/lib/points";

async function getPetAndVerify(id: string, userId: string) {
  const pet = await db.pet.findUnique({ where: { id } });
  if (!pet)                   return { pet: null, error: "Pet not found",    status: 404 };
  if (pet.ownerId !== userId) return { pet: null, error: "Forbidden",        status: 403 };
  return { pet, error: null, status: 200 };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json(pet);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const { name, species, breed, sex, isNeutered, dateOfBirth,
            weight, weightUnit, color, markings, microchipId,
            specialNotes, photoBase64, photoMimeType } = body;

    if (!name?.trim() || !species) {
      return NextResponse.json({ error: "Name and species are required." }, { status: 400 });
    }

    const updated = await db.pet.update({
      where: { id: pet!.id },
      data: {
        name:          name.trim(),
        species,
        breed:         breed?.trim()       || null,
        sex:           sex                 || null,
        isNeutered:    !!isNeutered,
        dateOfBirth:   dateOfBirth ? new Date(dateOfBirth) : null,
        weight:        weight ? parseFloat(weight) : null,
        weightUnit:    weightUnit ?? "LBS",
        color:         color?.trim()       || null,
        markings:      markings?.trim()    || null,
        microchipId:   microchipId?.trim() || null,
        specialNotes:  specialNotes?.trim() || null,
        ...(photoBase64 !== undefined && {
          photoData:    photoBase64 || null,
          photoMimeType: photoMimeType || null,
        }),
      },
    });

    // Award photo points only when photo is newly uploaded (not cleared)
    if (photoBase64 !== undefined && photoBase64 && !pet!.photoData) {
      void awardPoints(session.user.id, "add_photo", 20);
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    await db.vetVisitNote.deleteMany({ where: { petId: pet!.id } });
    await db.recordRequest.deleteMany({ where: { petId: pet!.id } });
    await db.vetAccess.deleteMany({    where: { petId: pet!.id } });
    await db.reminder.deleteMany({     where: { petId: pet!.id } });
    await db.vaccine.deleteMany({      where: { petId: pet!.id } });
    await db.healthRecord.deleteMany({ where: { petId: pet!.id } });
    await db.pet.delete({              where: { id:    pet!.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete pet." }, { status: 500 });
  }
}
