import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { awardPoints } from "@/lib/points";

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

const SYSTEM_PROMPT = `You are a veterinary medical record parser. Extract all health events from the provided text.
Return ONLY a valid JSON array with this structure — no markdown, no explanation:
[
  {
    "type": "VACCINATION" | "MEDICATION" | "VET_VISIT" | "LAB_RESULT" | "SURGERY" | "OTHER",
    "title": "short name of vaccine/drug/procedure",
    "date": "YYYY-MM-DD or null",
    "nextDueDate": "YYYY-MM-DD or null",
    "vetName": "vet name or null",
    "clinicName": "clinic name or null",
    "dosage": "dosage string or null",
    "notes": "any other relevant notes or null"
  }
]
Rules:
- VACCINATION for vaccines/boosters, MEDICATION for drugs/prescriptions
- VET_VISIT for checkups, LAB_RESULT for blood work/x-rays, SURGERY for procedures
- For approximate dates with only month/year, use the first day of that month
- Keep titles concise. Return [] if no records can be extracted.`;

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

    // Extract text from PDF
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

    // Call AI via shared helper (reads provider config from AppSettings in DB)
    const aiResponse = await callAI(
      [
        { role: "system", content: SYSTEM_PROMPT },
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
    if (err instanceof Error && err.message.includes("AI provider not configured")) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[pdf/extract]", err);
    return NextResponse.json({ error: "Failed to extract records from file." }, { status: 500 });
  }
}
