export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import Image from "next/image";

interface Props {
  params: { token: string };
}

const REMINDER_COLORS: Record<string, string> = {
  MEDICATION:  "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-800",
  VACCINATION: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 ring-blue-200",
  VET_VISIT:   "bg-purple-50 dark:bg-purple-900/20 text-purple-700 ring-purple-200",
  GROOMING:    "bg-pink-50 text-pink-700 ring-pink-200",
  FEEDING:     "bg-orange-50 text-orange-700 ring-orange-200",
  EXERCISE:    "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-800",
  OTHER:       "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-700",
};

const SPECIES_EMOJI: Record<string, string> = {
  DOG: "🐕", CAT: "🐈", BIRD: "🦜", RABBIT: "🐇",
  FISH: "🐠", REPTILE: "🦎", OTHER: "🐾",
};

function calcAge(dob: Date | null): string {
  if (!dob) return "Unknown";
  const diff = Date.now() - new Date(dob).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  if (years >= 1) return `${years}y ${months}m`;
  return `${months} months`;
}

export default async function SitterPage({ params }: Props) {
  const link = await db.sitterAccess.findUnique({
    where: { token: params.token },
    select: { id: true, isActive: true, expiresAt: true, petIds: true, label: true },
  });

  if (!link) {
    return <ExpiredPage message="This link doesn't exist or has been removed." />;
  }

  const isExpired = !link.isActive || link.expiresAt < new Date();
  if (isExpired) {
    return <ExpiredPage message="This sitter link has expired or been revoked by the owner." />;
  }

  const now     = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const pets = await db.pet.findMany({
    where:  { id: { in: link.petIds } },
    select: {
      id:           true,
      name:         true,
      species:      true,
      breed:        true,
      dateOfBirth:  true,
      weight:       true,
      weightUnit:   true,
      color:        true,
      sex:          true,
      isNeutered:   true,
      specialNotes: true,
      photoData:    true,
      reminders: {
        where:   { isCompleted: false, dueDate: { gte: now, lte: in7Days } },
        orderBy: { dueDate: "asc" },
        select:  { id: true, title: true, type: true, dueDate: true, notes: true },
      },
      healthRecords: {
        orderBy: { date: "desc" },
        take:    1,
        select:  { id: true, type: true, title: true, date: true, vetName: true, notes: true },
      },
    },
  });

  // Preserve owner-specified pet order
  const ordered = link.petIds
    .map((id) => pets.find((p) => p.id === id))
    .filter(Boolean) as typeof pets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      {/* Header banner */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white text-xl font-bold shadow">🐾</div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">EmergePet — Sitter View</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{link.label ?? "Pet Care Information"}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Expires</p>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {link.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {ordered.map((pet) => {
          const emoji = SPECIES_EMOJI[pet.species] ?? "🐾";
          const latestRecord = pet.healthRecords[0] ?? null;

          return (
            <div key={pet.id} className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
              {/* Pet header */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-50 to-transparent">
                <div className="relative h-16 w-16 shrink-0">
                  {pet.photoData ? (
                    <Image
                      src={pet.photoData}
                      alt={pet.name}
                      fill
                      className="rounded-2xl object-cover ring-2 ring-green-200 dark:ring-green-800"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl ring-2 ring-green-200 dark:ring-green-800">
                      {emoji}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{pet.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {pet.breed ?? pet.species.charAt(0) + pet.species.slice(1).toLowerCase()}
                    {pet.dateOfBirth ? ` · ${calcAge(pet.dateOfBirth)} old` : ""}
                    {pet.sex ? ` · ${pet.sex.charAt(0) + pet.sex.slice(1).toLowerCase()}` : ""}
                    {pet.isNeutered ? " (neutered)" : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {pet.weight && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {pet.weight} {pet.weightUnit?.toLowerCase()}
                      </span>
                    )}
                    {pet.color && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {pet.color}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Special notes */}
              {pet.specialNotes && (
                <div className="mx-6 mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Special Notes</p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{pet.specialNotes}</p>
                </div>
              )}

              {/* Upcoming reminders */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Upcoming Care (Next 7 Days)</p>
                {pet.reminders.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No upcoming tasks this week</p>
                ) : (
                  <div className="space-y-2">
                    {pet.reminders.map((r) => {
                      const colorClass = REMINDER_COLORS[r.type] ?? REMINDER_COLORS.OTHER;
                      const dueDate    = new Date(r.dueDate);
                      const isToday    = dueDate.toDateString() === now.toDateString();
                      const isTomorrow = dueDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                      const label      = isToday ? "Today" : isTomorrow ? "Tomorrow" : dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                      return (
                        <div key={r.id} className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                          <span className={`mt-0.5 shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${colorClass}`}>
                            {r.type.replace("_", " ")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                            {r.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.notes}</p>}
                          </div>
                          <span className={`shrink-0 text-xs font-semibold ${isToday ? "text-red-600" : "text-gray-500 dark:text-gray-400"}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Most recent health record */}
              {latestRecord && (
                <div className="px-6 pb-5">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Most Recent Health Record</p>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{latestRecord.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {latestRecord.type.replace("_", " ")}
                          {latestRecord.vetName ? ` · ${latestRecord.vetName}` : ""}
                        </p>
                        {latestRecord.notes && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">{latestRecord.notes}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {latestRecord.date ? new Date(latestRecord.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
          This page is read-only and shared by the pet owner via EmergePet. Do not share this link publicly.
        </p>
      </div>
    </div>
  );
}

function ExpiredPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700 text-3xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Link unavailable</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">Ask the pet owner to generate a new access link.</p>
      </div>
    </div>
  );
}
