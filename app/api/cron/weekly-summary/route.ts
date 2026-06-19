import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { sendEmail } from "@/lib/email";

// Protected cron route — schedule: every Monday at 8 AM
// Call with header: x-cron-secret: <CRON_SECRET>

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db.user.findMany({
    where: { onboardingCompleted: true, isActive: true },
    include: {
      pets: {
        include: {
          healthRecords: { orderBy: { date: "desc" }, take: 20 },
          vaccines: true,
          reminders: {
            where: { isCompleted: false },
            orderBy: { dueDate: "asc" },
            take: 10,
          },
        },
      },
    },
  });

  let emailsSent = 0;

  for (const user of users) {
    if (user.pets.length === 0) continue;

    const summaries: string[] = [];

    for (const pet of user.pets) {
      const recordSummary = pet.healthRecords
        .map((r) => `${r.type}: ${r.title}${r.date ? ` (${new Date(r.date).toDateString()})` : ""}`)
        .join("\n");

      const overdueVaccines = pet.vaccines
        .filter((v) => v.nextDueDate && new Date(v.nextDueDate) < new Date())
        .map((v) => v.name);

      const upcomingReminders = pet.reminders
        .map((r) => `${r.title} due ${new Date(r.dueDate).toDateString()}`)
        .join("\n");

      const prompt = `Pet: ${pet.name} (${pet.species})
Recent health records:
${recordSummary || "None"}

Overdue vaccines: ${overdueVaccines.join(", ") || "None"}

Upcoming reminders:
${upcomingReminders || "None"}

Analyze this pet's records and reminders. If there are concerns, overdue items, or actions the owner should take, write a 2-3 sentence plain-English summary in a friendly, caring tone. Do NOT use markdown. If everything looks fine and nothing is overdue, respond with exactly the word: NULL`;

      try {
        const text = await callAI([{ role: "user", content: prompt }]);
        if (text.trim().toUpperCase() !== "NULL") {
          summaries.push(`<strong>${pet.name}:</strong> ${text.trim()}`);
        }
      } catch (err) {
        console.error(`[weekly-summary] AI error for ${pet.name}:`, err);
      }
    }

    if (summaries.length === 0) continue;

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:40px">🐾</span>
          <h1 style="font-size:22px;font-weight:700;color:#111;margin:8px 0 0">EmergePet</h1>
        </div>
        <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px">
          Weekly health summary
        </h2>
        <p style="color:#555;font-size:14px;margin:0 0 20px">
          Here's your weekly update on your pets' health from EmergePet.
        </p>
        ${summaries.map((s) => `
          <div style="background:#f0fdf4;border-left:3px solid #16a34a;border-radius:4px;padding:12px 16px;margin-bottom:12px;font-size:14px;color:#333">
            ${s}
          </div>
        `).join("")}
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3333"}/dashboard"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px">
          Open EmergePet
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          Weekly summaries are sent every Monday. Manage your notifications in settings.
        </p>
      </div>
    `;

    try {
      await sendEmail({ to: user.email, subject: "Your weekly pet health summary — EmergePet", html });
    } catch (err) {
      console.error(`[cron/weekly-summary] Failed to send to ${user.email}:`, err);
    }
    emailsSent++;
  }

  return NextResponse.json({ emailsSent, usersChecked: users.length });
}
