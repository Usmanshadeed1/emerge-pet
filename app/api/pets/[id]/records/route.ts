import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeDrugNameWithFallback } from "@/lib/drug-map";
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

  const [recordsRaw, vaccines] = await Promise.all([
    db.healthRecord.findMany({
      where:   { petId: pet!.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    db.vaccine.findMany({
      where:   { petId: pet!.id },
      orderBy: { name: "asc" },
    }),
  ]);

  // Never send raw base64 to the client — use hasFile flag
  const records = recordsRaw.map(({ fileData, ...rest }) => ({
    ...rest,
    hasFile: !!fileData,
  }));

  return NextResponse.json({ records, vaccines });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const { type, title, date, nextDueDate, vetName, clinicName,
            dosage, notes, fileBase64, fileMimeType, fileName, source } = body;

    if (!type || !title?.trim()) {
      return NextResponse.json({ error: "Type and title are required." }, { status: 400 });
    }

    let normalizedDrugName: string | null = null;
    let brandDrugName: string | null = null;

    if (type === "MEDICATION") {
      const result = await normalizeDrugNameWithFallback(title);
      normalizedDrugName = result.normalizedDrugName;
      brandDrugName      = result.brandDrugName;
    }

    const record = await db.healthRecord.create({
      data: {
        petId:             pet!.id,
        type,
        title:             title.trim(),
        date:              date        ? new Date(date)        : null,
        nextDueDate:       nextDueDate ? new Date(nextDueDate) : null,
        vetName:           vetName?.trim()    || null,
        clinicName:        clinicName?.trim() || null,
        dosage:            dosage?.trim()     || null,
        notes:             notes?.trim()      || null,
        fileData:          fileBase64         || null,
        fileMimeType:      fileMimeType       || null,
        fileName:          fileName           || null,
        source:            source ?? "MANUAL",
        normalizedDrugName,
        brandDrugName,
      },
    });

    // For vaccinations, sync to Vaccine tracker table
    if (type === "VACCINATION" && title?.trim()) {
      const vaccineName = title.trim();
      const existing = await db.vaccine.findFirst({
        where: { petId: pet!.id, name: vaccineName },
      });

      const vaccineData = {
        administeredDate: date        ? new Date(date)        : null,
        nextDueDate:      nextDueDate ? new Date(nextDueDate) : null,
        vetName:          vetName?.trim()    || null,
        clinicName:       clinicName?.trim() || null,
        status:           computeVaccineStatus(nextDueDate ? new Date(nextDueDate) : null),
      };

      if (existing) {
        await db.vaccine.update({ where: { id: existing.id }, data: vaccineData });
      } else {
        await db.vaccine.create({ data: { petId: pet!.id, name: vaccineName, ...vaccineData } });
      }
    }

    void awardPoints(session.user.id, "log_record", 10);

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create record." }, { status: 500 });
  }
}

function computeVaccineStatus(nextDueDate: Date | null): "UP_TO_DATE" | "DUE_SOON" | "OVERDUE" | "NO_DUE_DATE" {
  if (!nextDueDate) return "NO_DUE_DATE";
  const now  = new Date();
  const days = Math.floor((nextDueDate.getTime() - now.getTime()) / 86_400_000);
  if (days < 0)  return "OVERDUE";
  if (days <= 30) return "DUE_SOON";
  return "UP_TO_DATE";
}
