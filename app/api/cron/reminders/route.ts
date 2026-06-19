import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

// Protected cron route — call with header: x-cron-secret: <CRON_SECRET>
// Schedule: daily at 8 AM — e.g. via Vercel Cron or an external scheduler

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const dayAfter = new Date(today.getTime() + 2 * 86_400_000);

  // Reminders due today or tomorrow that are not yet completed
  const reminders = await db.reminder.findMany({
    where: {
      isCompleted: false,
      dueDate: {
        gte: today,
        lt:  dayAfter,
      },
    },
    include: {
      pet: {
        include: { owner: { select: { email: true, name: true } } },
      },
    },
  });

  if (reminders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by owner email
  const byOwner = new Map<string, typeof reminders>();
  for (const r of reminders) {
    const email = r.pet.owner.email;
    byOwner.set(email, [...(byOwner.get(email) ?? []), r]);
  }

  let sent = 0;

  for (const [email, ownerReminders] of Array.from(byOwner.entries())) {
    const ownerName  = ownerReminders[0].pet.owner.name ?? "Pet owner";
    const todayItems = ownerReminders.filter(
      (r) => new Date(r.dueDate) >= today && new Date(r.dueDate) < tomorrow
    );
    const tomorrowItems = ownerReminders.filter(
      (r) => new Date(r.dueDate) >= tomorrow && new Date(r.dueDate) < dayAfter
    );

    const formatItem = (r: (typeof reminders)[0]) =>
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
            ${todayItems.map(formatItem).join("")}
          </ul>
        ` : ""}
        ${tomorrowItems.length > 0 ? `
          <p style="font-size:14px;font-weight:600;color:#111;margin:16px 0 6px">📅 Tomorrow</p>
          <ul style="color:#555;font-size:14px;padding-left:20px;margin:0 0 16px">
            ${tomorrowItems.map(formatItem).join("")}
          </ul>
        ` : ""}
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3333"}/dashboard/reminders"
           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
          View all reminders
        </a>
        <p style="color:#999;font-size:12px;margin:24px 0 0">
          You're receiving this because you have reminders set up in EmergePet.
        </p>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from:    "EmergePet <noreply@emergepet.com>",
        to:      email,
        subject: `Pet care reminders for today — EmergePet`,
        html,
      });
      sent++;
    } else {
      console.log(`[cron/reminders] Would send to ${email}:`, ownerReminders.map((r) => r.title));
      sent++;
    }
  }

  return NextResponse.json({ sent, total: reminders.length });
}
