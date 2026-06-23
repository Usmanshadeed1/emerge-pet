import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now        = new Date();
  const currentHour = now.getHours();
  const currentMin  = now.getMinutes();

  // Load admin settings
  const [sendTime, notifyBeforeStr, emailSubjectTpl, emailBodyTpl] = await Promise.all([
    getSetting("reminder_send_time")      ?? "08:00",
    getSetting("reminder_notify_before")  ?? "60",
    getSetting("reminder_email_subject")  ?? "🐾 Pet care reminder — {{petName}} · EmergePet",
    getSetting("reminder_email_template") ?? null,
  ]);

  const [sendHour, sendMinute] = (sendTime as string).split(":").map(Number);
  const notifyBefore = parseInt(notifyBeforeStr as string, 10) || 60;
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3333";

  // ── 1. DAILY DIGEST ──────────────────────────────────────────────────────────
  // Runs at admin-configured send time (checked hourly)
  let digestSent = 0;
  if (currentHour === sendHour) {
    const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const dayAfter = new Date(today.getTime() + 2 * 86_400_000);

    const digestReminders = await db.reminder.findMany({
      where: {
        isCompleted: false,
        type:        { not: "MEDICATION" },
        dueDate:     { gte: today, lt: dayAfter },
      },
      include: {
        pet: { include: { owner: { select: { email: true, name: true } } } },
      },
    });

    if (digestReminders.length > 0) {
      const byOwner = new Map<string, typeof digestReminders>();
      for (const r of digestReminders) {
        const email = r.pet.owner.email;
        byOwner.set(email, [...(byOwner.get(email) ?? []), r]);
      }

      for (const [email, ownerReminders] of Array.from(byOwner.entries())) {
        const ownerName   = ownerReminders[0].pet.owner.name ?? "Pet owner";
        const todayItems  = ownerReminders.filter((r) => new Date(r.dueDate) >= today && new Date(r.dueDate) < tomorrow);
        const tomorrowItems = ownerReminders.filter((r) => new Date(r.dueDate) >= tomorrow && new Date(r.dueDate) < dayAfter);

        const fmt = (r: (typeof digestReminders)[0]) =>
          `<li style="margin-bottom:6px"><strong>${r.title}</strong> — ${r.pet.name}${r.dueTime ? ` at ${r.dueTime}` : ""}</li>`;

        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:40px">🐾</span>
              <h1 style="font-size:22px;font-weight:700;color:#111;margin:8px 0 0">EmergePet</h1>
            </div>
            <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px">
              Pet care reminders for ${ownerName.split(" ")[0]}
            </h2>
            ${todayItems.length > 0 ? `
              <p style="font-size:14px;font-weight:600;color:#111;margin:16px 0 6px">📅 Today</p>
              <ul style="color:#555;font-size:14px;padding-left:20px;margin:0 0 16px">
                ${todayItems.map(fmt).join("")}
              </ul>` : ""}
            ${tomorrowItems.length > 0 ? `
              <p style="font-size:14px;font-weight:600;color:#111;margin:16px 0 6px">📅 Tomorrow</p>
              <ul style="color:#555;font-size:14px;padding-left:20px;margin:0 0 16px">
                ${tomorrowItems.map(fmt).join("")}
              </ul>` : ""}
            <a href="${appUrl}/dashboard/calendar"
               style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
              View Calendar
            </a>
            <p style="color:#999;font-size:12px;margin:24px 0 0">
              You're receiving this because you have reminders set up in EmergePet.
            </p>
          </div>`;

        try {
          await sendEmail({ to: email, subject: `Pet care reminders — EmergePet`, html });
          digestSent++;
        } catch (err) {
          console.error(`[cron/reminders] digest failed for ${email}:`, err);
        }
      }
    }
  }

  // ── 2. MEDICATION DOSE ALERTS ─────────────────────────────────────────────────
  // Runs every hour — checks if any dose time falls within the next notifyBefore window
  const nowMinutes = currentHour * 60 + currentMin;
  const windowStart = nowMinutes;
  const windowEnd   = nowMinutes + 60; // check next 60 min window

  const medicationReminders = await db.reminder.findMany({
    where: {
      isCompleted:  false,
      type:         "MEDICATION",
      reminderTimes: { isEmpty: false },
    },
    include: {
      pet: { include: { owner: { select: { email: true, name: true } } } },
    },
  });

  const today2     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const doseAlerts: { email: string; ownerName: string; petName: string; title: string; doseTime: string; notifyMins: number }[] = [];

  for (const r of medicationReminders) {
    // Skip if before start date or after end date
    if (new Date(r.dueDate) > now) continue;
    if (r.endDate && new Date(r.endDate) < today2) continue;

    const effectiveNotify = r.notifyBefore ?? notifyBefore;

    for (const doseTime of r.reminderTimes) {
      const [h, m] = doseTime.split(":").map(Number);
      const doseMinutes = h * 60 + m;
      const sendAtMinutes = doseMinutes - effectiveNotify;

      if (sendAtMinutes >= windowStart && sendAtMinutes < windowEnd) {
        doseAlerts.push({
          email:       r.pet.owner.email,
          ownerName:   r.pet.owner.name ?? "Pet owner",
          petName:     r.pet.name,
          title:       r.title,
          doseTime,
          notifyMins:  effectiveNotify,
        });
      }
    }
  }

  let doseSent = 0;
  const defaultBodyTpl = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:24px">
    <span style="font-size:40px">🐾</span>
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:8px 0 0">EmergePet</h1>
  </div>
  <h2 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px">Hi {{ownerName}},</h2>
  <p style="font-size:14px;color:#555;margin:0 0 16px">This is a reminder for <strong>{{petName}}</strong>.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px">
    <p style="font-size:16px;font-weight:600;color:#111;margin:0 0 4px">{{reminderTitle}}</p>
    <p style="font-size:13px;color:#555;margin:0">📅 {{dueDate}}{{doseTime}}</p>
  </div>
  <a href="{{appUrl}}/dashboard/calendar" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
    View Calendar
  </a>
  <p style="color:#999;font-size:12px;margin:24px 0 0">You're receiving this because you have reminders set up in EmergePet.</p>
</div>`;

  for (const alert of doseAlerts) {
    const bodyTpl  = (emailBodyTpl as string | null) ?? defaultBodyTpl;
    const today2Str = today2.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const [dh, dm] = alert.doseTime.split(":").map(Number);
    const period   = dh >= 12 ? "PM" : "AM";
    const hour12   = dh % 12 || 12;
    const timeStr  = ` at ${hour12}:${String(dm).padStart(2, "0")} ${period}`;

    const html = bodyTpl
      .replace(/\{\{ownerName\}\}/g,      alert.ownerName.split(" ")[0])
      .replace(/\{\{petName\}\}/g,         alert.petName)
      .replace(/\{\{reminderTitle\}\}/g,   alert.title)
      .replace(/\{\{dueDate\}\}/g,         today2Str)
      .replace(/\{\{doseTime\}\}/g,        timeStr)
      .replace(/\{\{appUrl\}\}/g,          appUrl);

    const subject = (emailSubjectTpl as string)
      .replace(/\{\{petName\}\}/g,         alert.petName)
      .replace(/\{\{ownerName\}\}/g,       alert.ownerName.split(" ")[0])
      .replace(/\{\{reminderTitle\}\}/g,   alert.title);

    try {
      await sendEmail({ to: alert.email, subject, html });
      doseSent++;
    } catch (err) {
      console.error(`[cron/reminders] dose alert failed for ${alert.email}:`, err);
    }
  }

  return NextResponse.json({ digestSent, doseSent });
}
