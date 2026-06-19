import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { awardPoints } from "@/lib/points";
import { getPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

async function getPetAndVerify(petId: string, userId: string) {
  const pet = await db.pet.findUnique({ where: { id: petId } });
  if (!pet) return { pet: null, error: "Pet not found", status: 404 };
  if (pet.ownerId !== userId) return { pet: null, error: "Forbidden", status: 403 };
  return { pet, error: null, status: 200 };
}

export interface ExtractedRecord {
  type: "VACCINATION" | "MEDICATION" | "VET_VISIT" | "LAB_RESULT" | "SURGERY" | "OTHER";
  title: string;
  date: string | null;
  nextDueDate: string | null;
  vetName: string | null;
  clinicName: string | null;
  dosage: string | null;
  notes: string | null;
}


export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pet, error, status } = await getPetAndVerify(params.id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5 MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileBase64 = buffer.toString("base64");

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    const extractedText = parsed.text?.trim() ?? "";

    if (extractedText.length < 50) {
      return NextResponse.json(
        { error: "Could not read this PDF. It may be scanned, password-protected, or contain no text." },
        { status: 422 }
      );
    }

    const systemPrompt = await getPrompt("prompt_pdf_extraction");

    // Call AI via shared helper (reads provider config from AppSettings in DB)
    const aiResponse = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: extractedText.slice(0, 8000) },
      ],
      { jsonMode: true }
    );

    let records: ExtractedRecord[] = [];
    try {
      const parsed = JSON.parse(aiResponse);
      records = Array.isArray(parsed) ? parsed : parsed.records ?? [];
    } catch {
      records = [];
    }

    // Flag suspicious dates
    const today = new Date();
    const flagged = records.map((r) => ({
      ...r,
      dateWarning:
        r.date && new Date(r.date) > today
          ? "This date is in the future — please verify."
          : r.nextDueDate && r.date && new Date(r.nextDueDate) < new Date(r.date)
          ? "Next due date is before administered date — please verify."
          : null,
    }));

    void awardPoints(session.user.id, "pdf_analysis", 10);

    // Return records + store the file data for attaching after user confirms import
    return NextResponse.json({
      records: flagged,
      fileBase64,
      fileMimeType: "application/pdf",
      fileName: file.name,
      petId: pet!.id,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("AI provider not configured") || err.message.includes("No AI provider configured"))) {
      return NextResponse.json({ error: "No AI provider configured. Go to Admin → App Settings → AI/LLM and add a provider." }, { status: 503 });
    }
    console.error("[pdf/extract]", err);
    return NextResponse.json({ error: "Failed to extract records from file." }, { status: 500 });
  }
}
