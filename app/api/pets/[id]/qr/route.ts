import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import QRCode from "qrcode";
import { randomBytes } from "crypto";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pet = await db.pet.findFirst({
    where:  { id: params.id, ownerId: session.user.id },
    select: { qrToken: true },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found." }, { status: 404 });
  }

  if (!pet.qrToken) {
    const newToken = randomBytes(16).toString("hex");
    await db.pet.update({ where: { id: params.id }, data: { qrToken: newToken } });
    pet.qrToken = newToken;
  }

  const baseUrl    = process.env.NEXTAUTH_URL ?? "http://localhost:3333";
  const targetUrl  = `${baseUrl}/emergency/${pet.qrToken}`;
  const pngBuffer  = await QRCode.toBuffer(targetUrl, {
    type:           "png",
    width:          400,
    margin:         2,
    color:          { dark: "#111827", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    status:  200,
    headers: {
      "Content-Type":  "image/png",
      "Cache-Control": "no-store",
    },
  });
}
