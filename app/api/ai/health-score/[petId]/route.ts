import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPremium } from "@/lib/premium";
import { callAI } from "@/lib/ai";
import { getPrompt } from "@/lib/prompts";
import { awardPoints } from "@/lib/points";

interface Category {
  name:       string;
  score:      number;
  statusNote: string;
}

interface Recommendation {
  label: "URGENT" | "SOON" | "TIP";
  text:  string;
}

interface HealthScoreResult {
  overallScore:    number;
  grade:           string;
  categories:      Category[];
  recommendations: Recommendation[];
}

export async function GET(
  _req: Request,
  { params }: { params: { petId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const premium = await isPremium(session.user.id);
  if (!premium) {
    return NextResponse.json({ error: "Premium subscription required." }, { status: 403 });
  }

  const pet = await db.pet.findFirst({
    where:  { id: params.petId, ownerId: session.user.id },
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

  const [records, reminders, completedReminders] = await Promise.all([
    db.healthRecord.findMany({
      where:   { petId: params.petId },
      orderBy: { date: "desc" },
      take:    50,
      select:  {
        type:        true,
        title:       true,
        date:        true,
        nextDueDate: true,
        dosage:      true,
        notes:       true,
        normalizedDrugName: true,
      },
    }),
    db.reminder.findMany({
      where:   { petId: params.petId, isCompleted: false },
      orderBy: { dueDate: "asc" },
      take:    20,
      select:  { title: true, type: true, dueDate: true, isCompleted: true },
    }),
    db.reminder.findMany({
      where:   { petId: params.petId, isCompleted: true },
      orderBy: { updatedAt: "desc" },
      take:    20,
      select:  { title: true, type: true, dueDate: true, isCompleted: true },
    }),
  ]);

  const ageYears = pet.dateOfBirth
    ? Math.floor((Date.now() - pet.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  const vaccines    = records.filter((r) => r.type === "VACCINATION");
  const medications = records.filter((r) => r.type === "MEDICATION");
  const vetVisits   = records.filter((r) => r.type === "VET_VISIT");
  const labResults  = records.filter((r) => r.type === "LAB_RESULT");
  const surgeries   = records.filter((r) => r.type === "SURGERY");
  const overdueReminders = reminders.filter((r) => new Date(r.dueDate) < new Date());

  const context = `
Pet Profile:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed ?? "Unknown"}
- Age: ${ageYears !== null ? `${ageYears} years` : "Unknown"}
- Sex: ${pet.sex ?? "Unknown"}, ${pet.isNeutered ? "Neutered/Spayed" : "Intact"}
- Weight: ${pet.weight ? `${pet.weight} ${pet.weightUnit}` : "Not recorded"}
- Known conditions/notes: ${pet.specialNotes ?? "None"}

Vaccination History (${vaccines.length} records):
${vaccines.length > 0
  ? vaccines.map((v) =>
      `- ${v.title}${v.date ? ` on ${new Date(v.date).toLocaleDateString()}` : ""}${v.nextDueDate ? `, next due ${new Date(v.nextDueDate).toLocaleDateString()}` : ""}`
    ).join("\n")
  : "No vaccination records on file"}

Active Medications (${medications.length}):
${medications.length > 0
  ? medications.map((m) =>
      `- ${m.normalizedDrugName ? `${m.normalizedDrugName} (${m.title})` : m.title}${m.dosage ? ` — ${m.dosage}` : ""}${m.notes ? ` — ${m.notes}` : ""}`
    ).join("\n")
  : "None"}

Recent Vet Visits (${vetVisits.length}):
${vetVisits.length > 0
  ? vetVisits.slice(0, 5).map((v) =>
      `- ${v.date ? new Date(v.date).toLocaleDateString() : "Unknown date"}: ${v.title}${v.notes ? ` — ${v.notes}` : ""}`
    ).join("\n")
  : "No vet visit records on file"}

Lab Results (${labResults.length}):
${labResults.length > 0
  ? labResults.slice(0, 5).map((l) =>
      `- ${l.date ? new Date(l.date).toLocaleDateString() : "Unknown date"}: ${l.title}${l.notes ? ` — ${l.notes}` : ""}`
    ).join("\n")
  : "None"}

Surgeries (${surgeries.length}):
${surgeries.length > 0
  ? surgeries.map((s) => `- ${s.title}${s.date ? ` on ${new Date(s.date).toLocaleDateString()}` : ""}`).join("\n")
  : "None"}

Pending Reminders (${reminders.length} total, ${overdueReminders.length} overdue):
${reminders.length > 0
  ? reminders.slice(0, 10).map((r) =>
      `- ${r.title} (${r.type}) due ${new Date(r.dueDate).toLocaleDateString()}${new Date(r.dueDate) < new Date() ? " — OVERDUE" : ""}`
    ).join("\n")
  : "No pending reminders"}

Completed Reminders (${completedReminders.length} in history):
${completedReminders.length > 0
  ? completedReminders.slice(0, 10).map((r) =>
      `- ${r.title} (${r.type}) — completed`
    ).join("\n")
  : "No completed reminders on record"}
`;

  const systemPrompt = await getPrompt("prompt_health_score");

  try {
    const raw    = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: context },
      ],
      { jsonMode: true }
    );

    const result = JSON.parse(raw) as HealthScoreResult;

    if (
      typeof result.overallScore !== "number" ||
      typeof result.grade !== "string" ||
      !Array.isArray(result.categories) ||
      result.categories.length !== 6 ||
      !Array.isArray(result.recommendations)
    ) {
      throw new Error("Invalid AI response shape");
    }

    void awardPoints(session.user.id, "health_score", 10);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed." },
      { status: 500 }
    );
  }
}
