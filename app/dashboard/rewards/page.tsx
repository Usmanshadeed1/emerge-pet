import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPremium } from "@/lib/premium";
import { calculateTier } from "@/lib/points";

const TIER_CONFIG: Record<string, { emoji: string; color: string; next: number | null; label: string }> = {
  "New Member":        { emoji: "🌱", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",    next: 101,  label: "New Member" },
  "Pet Lover":         { emoji: "💛", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700", next: 301,  label: "Pet Lover" },
  "Dedicated Owner":   { emoji: "💚", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",   next: 601,  label: "Dedicated Owner" },
  "Expert Caregiver":  { emoji: "💙", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",     next: 1000, label: "Expert Caregiver" },
  "Platinum Pet Parent": { emoji: "⭐", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700", next: null, label: "Platinum Pet Parent" },
};

const TIER_THRESHOLDS = [0, 101, 301, 601, 1000];

const ALL_BADGES = [
  { badge: "First Step",         emoji: "👋", desc: "First login",                     condition: "Log in for the first time" },
  { badge: "Pet Parent",         emoji: "🐾", desc: "Add your first pet",              condition: "Add 1 pet" },
  { badge: "Record Keeper",      emoji: "📋", desc: "Log 10 health records",           condition: "Log 10 health records" },
  { badge: "On Schedule",        emoji: "⏰", desc: "Complete 5 reminders",            condition: "Complete 5 reminders" },
  { badge: "AI Explorer",        emoji: "🤖", desc: "Use AI tools once",               condition: "Use any AI tool once" },
  { badge: "Consistent Care",    emoji: "🏆", desc: "Complete 30 reminders",           condition: "Complete 30 reminders" },
  { badge: "Health Champion",    emoji: "💪", desc: "Generate 5 health scores",        condition: "Generate 5 health scores" },
  { badge: "Family First",       emoji: "👨‍👩‍👧", desc: "Add a family member",              condition: "Invite a family member" },
  { badge: "Platinum Pet Parent",emoji: "⭐", desc: "Reach 1000 points",              condition: "Reach 1000 total points" },
];

const ACTION_LABELS: Record<string, string> = {
  add_pet:          "Added a pet",
  add_photo:        "Added a pet photo",
  log_record:       "Logged a health record",
  reminder_created: "Set a reminder",
  reminder_completed: "Completed a reminder",
  health_score:     "Generated a health score",
  symptom_check:    "Ran a symptom check",
  pdf_analysis:     "Analysed a PDF record",
  daily_login:      "Daily login",
};

export default async function RewardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId  = session.user.id;
  const premium = await isPremium(userId);

  if (!premium) {
    return (
      <div className="mx-auto max-w-2xl anim-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rewards</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Earn points for healthy pet care habits.</p>
        </div>
        <div className="mt-6 rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-3xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Premium feature</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Earn points, unlock badges, and level up your tier with a Premium subscription.
          </p>
          <a href="/dashboard/upgrade"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-600 transition">
            Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  const [rewardPoints, transactions, achievements] = await Promise.all([
    db.rewardPoints.findUnique({ where: { userId }, select: { totalPoints: true, tier: true } }),
    db.pointTransaction.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    10,
      select:  { id: true, action: true, points: true, createdAt: true },
    }),
    db.achievement.findMany({
      where:  { userId },
      select: { badge: true, unlockedAt: true },
    }),
  ]);

  const totalPoints  = rewardPoints?.totalPoints ?? 0;
  const currentTier  = calculateTier(totalPoints);
  const tierConfig   = TIER_CONFIG[currentTier] ?? TIER_CONFIG["New Member"];
  const earnedBadges = new Set(achievements.map((a) => a.badge));

  // Progress bar within current tier
  const tierIdx   = TIER_THRESHOLDS.findIndex((t, i) => {
    const next = TIER_THRESHOLDS[i + 1] ?? Infinity;
    return totalPoints >= t && totalPoints < next;
  });
  const tierStart = TIER_THRESHOLDS[Math.max(0, tierIdx)] ?? 0;
  const tierEnd   = TIER_THRESHOLDS[tierIdx + 1] ?? null;
  const pct       = tierEnd ? Math.min(100, Math.round(((totalPoints - tierStart) / (tierEnd - tierStart)) * 100)) : 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6 anim-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rewards</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Earn points by caring for your pets and unlock badges.</p>
      </div>

      {/* Tier card */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${tierConfig.color}`}>
            {tierConfig.emoji}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current tier</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{currentTier}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{totalPoints.toLocaleString()} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">pts</span></p>
          </div>
        </div>

        {tierEnd ? (
          <>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{totalPoints} pts</span>
              <span>{tierEnd} pts — {calculateTier(tierEnd)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{tierEnd - totalPoints} pts to next tier</p>
          </>
        ) : (
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 px-4 py-2.5 text-sm text-purple-700 font-semibold">
            🎉 You&apos;ve reached the highest tier — Platinum Pet Parent!
          </div>
        )}
      </div>

      {/* Achievements grid */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_BADGES.map(({ badge, emoji, desc, condition }) => {
            const unlocked = earnedBadges.has(badge);
            const info     = achievements.find((a) => a.badge === badge);
            return (
              <div key={badge}
                className={`rounded-xl border p-4 flex flex-col items-center text-center gap-2 transition ${
                  unlocked
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 opacity-60"
                }`}>
                <div className={`text-3xl ${unlocked ? "" : "grayscale"}`}>{emoji}</div>
                <p className={`text-sm font-semibold ${unlocked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{badge}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{unlocked ? desc : condition}</p>
                {unlocked && info && (
                  <p className="text-xs text-green-600 font-medium">
                    {new Date(info.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent activity</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No points earned yet. Start by adding a pet!</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ACTION_LABELS[tx.action] ?? tx.action}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600">+{tx.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">How to earn points</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { action: "Add a pet",               pts: 50 },
            { action: "Add a pet photo",          pts: 20 },
            { action: "Complete a reminder",      pts: 15 },
            { action: "Log a health record",      pts: 10 },
            { action: "Generate a health score",  pts: 10 },
            { action: "Run a symptom check",      pts: 10 },
            { action: "Analyse a PDF record",     pts: 10 },
            { action: "Set a reminder",           pts: 5  },
            { action: "Daily login",              pts: 5  },
          ].map(({ action, pts }) => (
            <div key={action} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">{action}</span>
              <span className="text-xs font-bold text-green-600">+{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
