import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Public route — no auth required
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { vetAccessId, chiefComplaint, diagnosis, treatments, dischargeInstructions } = body;

  if (!vetAccessId) {
    return NextResponse.json({ error: "vetAccessId is required." }, { status: 400 });
  }

  const vetAccess = await db.vetAccess.findUnique({
    where:  { id: vetAccessId },
    select: {
      id:       true,
      isActive: true,
      petId:    true,
      vetName:  true,
      pet: {
        select: {
          id:      true,
          name:    true,
          species: true,
          owner: {
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  if (!vetAccess || !vetAccess.isActive) {
    return NextResponse.json({ error: "Invalid or revoked access code." }, { status: 403 });
  }

  // Create VetVisitNote record
  const note = await db.vetVisitNote.create({
    data: {
      vetAccessId:          vetAccess.id,
      petId:                vetAccess.petId,
      chiefComplaint:       chiefComplaint?.trim()        || null,
      diagnosis:            diagnosis?.trim()             || null,
      treatments:           treatments?.trim()            || null,
      dischargeInstructions: dischargeInstructions?.trim() || null,
    },
  });

  // Create a HealthRecord with source = VET_PUSHED
  const title = diagnosis?.trim()
    ? `Vet Visit: ${diagnosis.trim().slice(0, 60)}`
    : `Vet Visit Note${vetAccess.vetName ? ` from ${vetAccess.vetName}` : ""}`;

  await db.healthRecord.create({
    data: {
      petId:     vetAccess.petId,
      type:      "VET_VISIT",
      title,
      date:      new Date(),
      vetName:   vetAccess.vetName ?? null,
      notes:     [
        chiefComplaint   ? `Chief Complaint: ${chiefComplaint}`             : null,
        diagnosis        ? `Diagnosis: ${diagnosis}`                         : null,
        treatments       ? `Treatments: ${treatments}`                       : null,
        dischargeInstructions ? `Discharge: ${dischargeInstructions}`        : null,
      ].filter(Boolean).join("\n\n") || null,
      source: "VET_PUSHED",
    },
  });

  // Email the owner
  try {
    await sendEmail({
      to:      vetAccess.pet.owner.email,
      subject: `${vetAccess.pet.name}'s vet visit note has been submitted`,
      html: `
        <p>Hi ${vetAccess.pet.owner.name ?? "there"},</p>
        <p>Your vet${vetAccess.vetName ? ` (${vetAccess.vetName})` : ""} has submitted a visit note for <strong>${vetAccess.pet.name}</strong>.</p>
        ${chiefComplaint       ? `<p><strong>Chief Complaint:</strong> ${chiefComplaint}</p>`             : ""}
        ${diagnosis            ? `<p><strong>Diagnosis:</strong> ${diagnosis}</p>`                         : ""}
        ${treatments           ? `<p><strong>Treatments:</strong> ${treatments}</p>`                       : ""}
        ${dischargeInstructions ? `<p><strong>Discharge Instructions:</strong> ${dischargeInstructions}</p>` : ""}
        <p>You can view the full record in your EmergePet dashboard.</p>
      `,
    });
  } catch {
    // Email failure does not fail the request
  }

  return NextResponse.json({ success: true, noteId: note.id }, { status: 201 });
}
