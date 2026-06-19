import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys = await db.emrKey.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clinicName } = await req.json() as { clinicName: string };
  if (!clinicName?.trim()) {
    return NextResponse.json({ error: "Clinic name is required." }, { status: 400 });
  }

  const rawKey  = "emr_" + randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const key = await db.emrKey.create({
    data: { clinicName: clinicName.trim(), keyHash },
  });

  // rawKey is returned ONCE — never stored in plaintext
  return NextResponse.json({ ...key, rawKey }, { status: 201 });
}
