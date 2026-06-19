import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 30;

const CACHE_DAYS = 30;

interface BreedGuide {
  breed: string;
  species: string;
  healthRisks: string;
  diet: string;
  exercise: string;
  grooming: string;
  lifespan: string;
  generatedAt: string;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pet = await db.pet.findUnique({ where: { id: params.id } });
  if (!pet || pet.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  // Return cached guide if still fresh and breed hasn't changed
  if (pet.breedGuideContent && pet.breedGuideGeneratedAt) {
    const ageInDays = (Date.now() - pet.breedGuideGeneratedAt.getTime()) / 86_400_000;
    const guide = JSON.parse(pet.breedGuideContent) as BreedGuide;
    if (ageInDays < CACHE_DAYS && guide.breed === (pet.breed ?? pet.species)) {
      return NextResponse.json({ guide, cached: true });
    }
  }

  const breedLabel = pet.breed ? `${pet.breed} (${pet.species})` : pet.species;

  const systemPrompt = `You are a veterinary expert. Return ONLY a valid JSON object — no markdown, no explanation.`;
  const userPrompt = `Generate a breed care guide for: ${breedLabel}.
Return exactly this JSON shape:
{
  "healthRisks": "2-4 sentences about common health conditions and what to watch for",
  "diet": "2-3 sentences about ideal diet, portion sizes, and foods to avoid",
  "exercise": "2-3 sentences about daily exercise requirements and preferred activities",
  "grooming": "2-3 sentences about coat care, bathing frequency, and grooming needs",
  "lifespan": "1-2 sentences about typical lifespan and longevity factors"
}
Be specific to the breed. Use practical, actionable language.`;

  try {
    const text = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { jsonMode: true }
    );

    const parsed = JSON.parse(text) as Omit<BreedGuide, "breed" | "species" | "generatedAt">;

    const guide: BreedGuide = {
      breed: pet.breed ?? pet.species,
      species: pet.species,
      generatedAt: new Date().toISOString(),
      ...parsed,
    };

    await db.pet.update({
      where: { id: pet.id },
      data: {
        breedGuideContent: JSON.stringify(guide),
        breedGuideGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({ guide, cached: false });
  } catch (err) {
    if (err instanceof Error && err.message.includes("AI provider not configured")) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[breed-guide]", err);
    return NextResponse.json({ error: "Failed to generate breed guide." }, { status: 500 });
  }
}
