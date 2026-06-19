import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getPrompt } from "@/lib/prompts";

interface VisitPrepResult {
  currentConcerns:      string[];
  activeMedications:    string[];
  questionsForVet:      string[];
  upcomingCare:         string[];
  recentLabHighlights:  string[];
}

export async function GET(
  _req: Request,
  { params }: { params: { petId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pet = await db.pet.findFirst({
    where: { id: params.petId, ownerId: session.user.id },
    select: {
      name:         true,
      species:      true,
      breed:        true,
      dateOfBirth:  true,
      weight:       true,
      weightUnit:   true,
      sex:          true,
      isNeutered:   true,
      specialNotes: true,
    },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }

  // ── Gather all relevant data ──────────────────────────────────────────────

  const [records, reminders] = await Promise.all([
    db.healthRecord.findMany({
      where:   { petId: params.petId },
      orderBy: { date: "desc" },
      take:    30,
      select:  {
        type:      true,
        title:     true,
        date:      true,
        nextDueDate: true,
        vetName:   true,
        clinicName: true,
        dosage:    true,
        notes:     true,
        normalizedDrugName: true,
      },
    }),
    db.reminder.findMany({
      where:   { petId: params.petId, isCompleted: false, dueDate: { gte: new Date() } },
      orderBy: { dueDate: "asc" },
      take:    10,
      select:  { title: true, type: true, dueDate: true, notes: true },
    }),
  ]);

  const ageYears = pet.dateOfBirth
    ? Math.floor((Date.now() - pet.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  const medications  = records.filter((r) => r.type === "MEDICATION");
  const vetVisits    = records.filter((r) => r.type === "VET_VISIT").slice(0, 5);
  const labResults   = records.filter((r) => r.type === "LAB_RESULT").slice(0, 5);
  const vaccinations = records.filter((r) => r.type === "VACCINATION").slice(0, 10);
  const surgeries    = records.filter((r) => r.type === "SURGERY").slice(0, 5);

  const context = `
Pet Profile:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed ?? "Unknown"}
- Age: ${ageYears !== null ? `${ageYears} years` : "Unknown"}
- Sex: ${pet.sex ?? "Unknown"}, ${pet.isNeutered ? "Neutered/Spayed" : "Intact"}
- Weight: ${pet.weight ? `${pet.weight} ${pet.weightUnit}` : "Unknown"}
- Known conditions/notes: ${pet.specialNotes ?? "None"}

Active Medications (${medications.length}):
${medications.length > 0
  ? medications.map((m) =>
      `- ${m.normalizedDrugName ? `${m.normalizedDrugName} (${m.title})` : m.title}${m.dosage ? ` — ${m.dosage}` : ""}${m.notes ? ` — Notes: ${m.notes}` : ""}`
    ).join("\n")
  : "None"}

Recent Vet Visits (${vetVisits.length}):
${vetVisits.length > 0
  ? vetVisits.map((v) =>
      `- ${v.date ? new Date(v.date).toLocaleDateString() : "Unknown date"}: ${v.title}${v.vetName ? ` (Dr. ${v.vetName})` : ""}${v.notes ? ` — ${v.notes}` : ""}`
    ).join("\n")
  : "None on record"}

Recent Lab Results (${labResults.length}):
${labResults.length > 0
  ? labResults.map((l) =>
      `- ${l.date ? new Date(l.date).toLocaleDateString() : "Unknown date"}: ${l.title}${l.notes ? ` — ${l.notes}` : ""}`
    ).join("\n")
  : "None on record"}

Vaccination History (${vaccinations.length}):
${vaccinations.length > 0
  ? vaccinations.map((v) =>
      `- ${v.title}${v.date ? ` given ${new Date(v.date).toLocaleDateString()}` : ""}${v.nextDueDate ? `, due ${new Date(v.nextDueDate).toLocaleDateString()}` : ""}`
    ).join("\n")
  : "None on record"}

Surgeries (${surgeries.length}):
${surgeries.length > 0
  ? surgeries.map((s) => `- ${s.title}${s.date ? ` on ${new Date(s.date).toLocaleDateString()}` : ""}`).join("\n")
  : "None"}

Upcoming Reminders (${reminders.length}):
${reminders.length > 0
  ? reminders.map((r) =>
      `- ${r.title} (${r.type}) — due ${new Date(r.dueDate).toLocaleDateString()}${r.notes ? ` — ${r.notes}` : ""}`
    ).join("\n")
  : "None scheduled"}
`;

  const systemPrompt = await getPrompt("prompt_visit_prep");

  try {
    const raw    = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: context },
      ],
      { jsonMode: true }
    );

    const result = JSON.parse(raw) as VisitPrepResult;

    if (
      !Array.isArray(result.currentConcerns) ||
      !Array.isArray(result.activeMedications) ||
      !Array.isArray(result.questionsForVet) ||
      !Array.isArray(result.upcomingCare) ||
      !Array.isArray(result.recentLabHighlights)
    ) {
      throw new Error("Invalid AI response shape");
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed." },
      { status: 500 }
    );
  }
}
