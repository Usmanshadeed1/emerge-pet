import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { db } from "@/lib/db";

const SENSITIVE = new Set([
  "resend_api_key", "revenuecat_api_key",
  "google_places_key", "mailchimp_api_key",
  "smtp_password",
]);

const ALL_KEYS = [
  "resend_api_key", "resend_from_email",
  "smtp_host", "smtp_port", "smtp_user", "smtp_password",
  "smtp_tls", "smtp_from_email",
  "email_provider",
  "revenuecat_api_key",
  "google_places_key",
  "mailchimp_api_key", "mailchimp_audience_id",
];

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result: Record<string, string | boolean | null> = {};

  for (const key of ALL_KEYS) {
    if (SENSITIVE.has(key)) {
      const row = await db.appSettings.findUnique({ where: { key } });
      result[key]          = null;
      result[`${key}_set`] = !!row;
    } else {
      result[key] = await getSetting(key);
    }
  }

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Record<string, string>;

  for (const [key, value] of Object.entries(body)) {
    if (!ALL_KEYS.includes(key)) continue;
    if (value === null || value === undefined || value === "") continue;
    await setSetting(key, value, SENSITIVE.has(key));
  }

  return NextResponse.json({ success: true });
}
