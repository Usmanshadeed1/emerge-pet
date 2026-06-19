import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emrAuth, emrUnauthorized } from "@/lib/emr-auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const clinic = await emrAuth(req);
  if (!clinic) return emrUnauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { petId, type, title, date, nextDueDate, vetName, dosage, notes } = body as {
    petId:       string;
    type:        string;
    title:       string;
    date?:       string;
    nextDueDate?: string;
    vetName?:    string;
    dosage?:     string;
    notes?:      string;
  };

  if (!petId || !type || !title) {
    return NextResponse.json(
      { error: "petId, type, and title are required." },
      { status: 400 },
    );
  }

  const validTypes = ["VACCINATION", "MEDICATION", "VET_VISIT", "LAB_RESULT", "SURGERY", "OTHER"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 },
    );
  }

  // Fetch pet + owner to verify existence and get notification email
  const pet = await db.pet.findUnique({
    where:  { id: petId },
    select: { id: true, name: true, species: true, owner: { select: { email: true, name: true } } },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }

  const record = await db.healthRecord.create({
    data: {
      petId,
      type:       type as "VACCINATION" | "MEDICATION" | "VET_VISIT" | "LAB_RESULT" | "SURGERY" | "OTHER",
      title,
      date:        date        ? new Date(date)        : null,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      vetName:     vetName     ?? null,
      clinicName:  clinic.clinicName,
      dosage:      dosage      ?? null,
      notes:       notes       ?? null,
      source:      "VET_PUSHED",
    },
  });

  // Notify pet owner — non-fatal
  sendEmail({
    to:      pet.owner.email,
    subject: `New health record added for ${pet.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#16a34a">New health record for ${pet.name}</h2>
        <p>Hi ${pet.owner.name ?? "there"},</p>
        <p><strong>${clinic.clinicName}</strong> has added a new health record for your pet <strong>${pet.name}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Type</td><td style="padding:8px;border:1px solid #e5e7eb">${type}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Title</td><td style="padding:8px;border:1px solid #e5e7eb">${title}</td></tr>
          ${date ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Date</td><td style="padding:8px;border:1px solid #e5e7eb">${new Date(date).toLocaleDateString()}</td></tr>` : ""}
          ${notes ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Notes</td><td style="padding:8px;border:1px solid #e5e7eb">${notes}</td></tr>` : ""}
        </table>
        <p>You can view this record in your <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard/pets" style="color:#16a34a">EmergePet dashboard</a>.</p>
        <p style="color:#9ca3af;font-size:12px">This record was pushed by ${clinic.clinicName} via the EmergePet EMR Integration.</p>
      </div>
    `,
  }).catch(() => {});

  return NextResponse.json({ record }, { status: 201 });
}
