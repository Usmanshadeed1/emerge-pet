import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeDrugNameWithFallback } from "@/lib/drug-map";

async function getRecordAndVerify(recordId: string, petId: string, userId: string) {
  const record = await db.healthRecord.findUnique({ where: { id: recordId } });
  if (!record || record.petId !== petId) return { record: null, error: "Record not found", status: 404 };

  const pet = await db.pet.findUnique({ where: { id: petId } });
  if (!pet || pet.ownerId !== userId) return { record: null, error: "Forbidden", status: 403 };

  return { record, error: null, status: 200 };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { record, error, status } = await getRecordAndVerify(
    params.recordId, params.id, session.user.id
  );
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const { type, title, date, nextDueDate, vetName, clinicName,
            dosage, notes } = body;

    if (!type || !title?.trim()) {
      return NextResponse.json({ error: "Type and title are required." }, { status: 400 });
    }

    let normalizedDrugName = record!.normalizedDrugName;
    let brandDrugName      = record!.brandDrugName;

    if (type === "MEDICATION") {
      const result = await normalizeDrugNameWithFallback(title);
      normalizedDrugName = result.normalizedDrugName;
      brandDrugName      = result.brandDrugName;
    }

    const updated = await db.healthRecord.update({
      where: { id: record!.id },
      data: {
        type,
        title:             title.trim(),
        date:              date        ? new Date(date)        : null,
        nextDueDate:       nextDueDate ? new Date(nextDueDate) : null,
        vetName:           vetName?.trim()    || null,
        clinicName:        clinicName?.trim() || null,
        dosage:            dosage?.trim()     || null,
        notes:             notes?.trim()      || null,
        normalizedDrugName,
        brandDrugName,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update record." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { record, error, status } = await getRecordAndVerify(
    params.recordId, params.id, session.user.id
  );
  if (error) return NextResponse.json({ error }, { status });

  await db.healthRecord.delete({ where: { id: record!.id } });
  return NextResponse.json({ success: true });
}
