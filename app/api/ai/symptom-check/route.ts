import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getPrompt } from "@/lib/prompts";
import { isPremium } from "@/lib/premium";
import { awardPoints } from "@/lib/points";

interface SymptomCheckResult {
  urgencyLevel:       "URGENT" | "MONITOR" | "NON_URGENT";
  summary:            string;
  reasoning:          string;
  recommendedActions: string[];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const premium = await isPremium(session.user.id);
  if (!premium) {
    return NextResponse.json({ error: "Premium subscription required." }, { status: 403 });
  }

  const body = await req.json() as { petId?: string; symptomText: string };

  if (!body.symptomText?.trim()) {
    return NextResponse.json({ error: "symptomText is required." }, { status: 400 });
  }

  // Build pet context if a pet was selected
  let petContext = "";
  if (body.petId) {
    const pet = await db.pet.findFirst({
      where: { id: body.petId, ownerId: session.user.id },
      select: {
        name:         true,
        species:      true,
        breed:        true,
        dateOfBirth:  true,
        weight:       true,
        weightUnit:   true,
        isNeutered:   true,
        specialNotes: true,
        sex:          true,
        healthRecords: {
          where:   { type: "MEDICATION" },
          select:  { title: true, dosage: true },
          orderBy: { createdAt: "desc" },
          take:    5,
        },
      },
    });

    if (pet) {
      const ageYears = pet.dateOfBirth
        ? Math.floor((Date.now() - pet.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null;

      const meds = pet.healthRecords.map((r) => `${r.title}${r.dosage ? ` (${r.dosage})` : ""}`).join(", ");

      petContext = `
Pet Details:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed ?? "Unknown"}
- Age: ${ageYears !== null ? `${ageYears} years` : "Unknown"}
- Sex: ${pet.sex ?? "Unknown"}, ${pet.isNeutered ? "Neutered/Spayed" : "Intact"}
- Weight: ${pet.weight ? `${pet.weight} ${pet.weightUnit}` : "Unknown"}
- Known conditions/notes: ${pet.specialNotes ?? "None"}
- Current medications: ${meds || "None"}
`;
    }
  }

  const systemPrompt = await getPrompt("prompt_symptom_check");

  const userMessage = petContext
    ? `${petContext}\nSymptoms reported:\n${body.symptomText.trim()}`
    : `Symptoms reported:\n${body.symptomText.trim()}`;

  try {
    const raw = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
      { jsonMode: true }
    );

    const result = JSON.parse(raw) as SymptomCheckResult;

    // Validate shape
    if (!result.urgencyLevel || !result.summary || !Array.isArray(result.recommendedActions)) {
      throw new Error("Invalid AI response shape");
    }

    void awardPoints(session.user.id, "symptom_check", 10);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI analysis failed." },
      { status: 500 }
    );
  }
}
