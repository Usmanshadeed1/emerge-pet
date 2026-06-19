import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import {
  PROMPT_SYMPTOM_CHECK,
  PROMPT_BREED_GUIDE,
  PROMPT_HEALTH_SCORE,
  PROMPT_VISIT_PREP,
  PROMPT_ADVISOR,
  PROMPT_WEEKLY_SUMMARY,
} from "@/lib/prompts";

const PROMPT_KEYS = [
  "prompt_symptom_check",
  "prompt_breed_guide",
  "prompt_health_score",
  "prompt_visit_prep",
  "prompt_advisor",
  "prompt_weekly_summary",
] as const;

const DEFAULTS: Record<string, string> = {
  prompt_symptom_check:  PROMPT_SYMPTOM_CHECK,
  prompt_breed_guide:    PROMPT_BREED_GUIDE,
  prompt_health_score:   PROMPT_HEALTH_SCORE,
  prompt_visit_prep:     PROMPT_VISIT_PREP,
  prompt_advisor:        PROMPT_ADVISOR,
  prompt_weekly_summary: PROMPT_WEEKLY_SUMMARY,
};

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result: Record<string, { value: string; isCustom: boolean; default: string }> = {};

  for (const key of PROMPT_KEYS) {
    const saved = await getSetting(key);
    result[key] = {
      value:    saved ?? DEFAULTS[key],
      isCustom: !!saved,
      default:  DEFAULTS[key],
    };
  }

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { key: string; value: string | null };

  if (!PROMPT_KEYS.includes(body.key as typeof PROMPT_KEYS[number])) {
    return NextResponse.json({ error: "Invalid prompt key." }, { status: 400 });
  }

  if (body.value === null) {
    // Reset to default — delete the override
    const { db } = await import("@/lib/db");
    await db.appSettings.deleteMany({ where: { key: body.key } });
  } else {
    await setSetting(body.key, body.value);
  }

  return NextResponse.json({ ok: true });
}
