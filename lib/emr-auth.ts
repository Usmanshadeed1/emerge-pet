import { createHash } from "crypto";
import { db } from "@/lib/db";

export interface EmrClinic {
  id:         string;
  clinicName: string;
}

/**
 * Validates X-API-Key header against hashed EmrKey records.
 * Returns the clinic on success, null on failure.
 */
export async function emrAuth(req: Request): Promise<EmrClinic | null> {
  const rawKey = req.headers.get("X-API-Key");
  if (!rawKey) return null;

  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const record = await db.emrKey.findUnique({
    where:  { keyHash },
    select: { id: true, clinicName: true, isActive: true },
  });

  if (!record || !record.isActive) return null;

  // Update lastUsedAt — non-fatal
  db.emrKey.update({
    where: { id: record.id },
    data:  { lastUsedAt: new Date() },
  }).catch(() => {});

  return { id: record.id, clinicName: record.clinicName };
}

export function emrUnauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized. Valid X-API-Key required." }), {
    status:  401,
    headers: { "Content-Type": "application/json" },
  });
}
