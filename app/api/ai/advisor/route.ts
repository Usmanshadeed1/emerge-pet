import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getPrompt } from "@/lib/prompts";

interface Message {
  role:    "user" | "assistant";
  content: string;
}

interface AdvisorRequest {
  petId?:              string;
  message:             string;
  conversationHistory: Message[];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AdvisorRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { petId, message, conversationHistory = [] } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // Fetch pet context if petId provided
  let petContext = "";
  if (petId) {
    const pet = await db.pet.findFirst({
      where:  { id: petId, ownerId: session.user.id },
      select: {
        name:        true,
        species:     true,
        breed:       true,
        dateOfBirth: true,
        sex:         true,
        isNeutered:  true,
        weight:      true,
        weightUnit:  true,
        specialNotes: true,
      },
    });

    if (pet) {
      const ageYears = pet.dateOfBirth
        ? Math.floor((Date.now() - pet.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null;

      petContext = `\n\nThe user's pet context: ${pet.name} is a ${ageYears !== null ? `${ageYears}-year-old ` : ""}${pet.sex ? `${pet.sex.toLowerCase()} ` : ""}${pet.isNeutered ? "neutered " : ""}${pet.species.toLowerCase()}${pet.breed ? ` (${pet.breed})` : ""}${pet.weight ? `, weighing ${pet.weight} ${pet.weightUnit}` : ""}${pet.specialNotes ? `. Known notes: ${pet.specialNotes}` : ""}. Tailor advice to this pet specifically.`;
    }
  }

  const systemPrompt = (await getPrompt("prompt_advisor")) + petContext;

  // Build message history for AI (cap at last 10 exchanges to avoid token overflow)
  const recentHistory = conversationHistory.slice(-10);
  const messages = [
    { role: "system" as const,    content: systemPrompt },
    ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const,      content: message },
  ];

  try {
    const response = await callAI(messages);

    // Extract any product/resource links from the response (markdown links)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const links: { text: string; url: string }[] = [];
    let match;
    while ((match = linkRegex.exec(response)) !== null) {
      links.push({ text: match[1], url: match[2] });
    }

    return NextResponse.json({ response, links });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed." },
      { status: 500 }
    );
  }
}
