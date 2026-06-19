import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { petId, clinicName, clinicEmail } = await req.json();

    if (!petId || !clinicName?.trim() || !clinicEmail?.trim()) {
      return NextResponse.json(
        { error: "petId, clinicName, and clinicEmail are required." },
        { status: 400 }
      );
    }

    const pet = await db.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const uploadToken = randomBytes(24).toString("hex");

    const request = await db.recordRequest.create({
      data: {
        petId,
        clinicName:  clinicName.trim(),
        clinicEmail: clinicEmail.trim(),
        uploadToken,
      },
    });

    const uploadUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3333"}/records/upload/${uploadToken}`;

    try {
      await sendEmail({
        to:      clinicEmail.trim(),
        subject: `Medical records request for ${pet.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:40px">🐾</span>
              <h1 style="font-size:22px;font-weight:700;color:#111;margin:8px 0 0">EmergePet</h1>
            </div>
            <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px">
              Records request for ${pet.name}
            </h2>
            <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px">
              A pet owner has requested that you upload medical records for their pet,
              <strong>${pet.name}</strong>. Click the button below to securely upload the records.
              This link is single-use and does not require a login.
            </p>
            <a href="${uploadUrl}"
               style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
                      padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
              Upload records for ${pet.name}
            </a>
            <p style="color:#999;font-size:12px;margin:24px 0 0">
              If you did not expect this request, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error(`[record-requests] Email failed for ${clinicEmail}:`, err);
    }

    return NextResponse.json({ request, uploadUrl }, { status: 201 });
  } catch (err) {
    console.error("[record-requests]", err);
    return NextResponse.json({ error: "Failed to send request." }, { status: 500 });
  }
}
