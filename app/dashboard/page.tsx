import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { speciesEmoji, petAge } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const petsRaw  = session?.user?.id
    ? await db.pet.findMany({
        where:   { ownerId: session.user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, species: true, breed: true,
                  dateOfBirth: true, photoData: true, sex: true, isNeutered: true },
      })
    : [];
  const pets = petsRaw.map(({ photoData, ...rest }) => ({ ...rest, hasPhoto: !!photoData }));

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Pets</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Welcome back, {firstName} 👋</p>
        </div>
        <Link href="/dashboard/pets/new"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700 hover:scale-[1.02]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Pet
        </Link>
      </div>

      {pets.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-20 text-center">
          <div className="mb-5 text-6xl">🐾</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No pets yet</h2>
          <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Add your first pet to start tracking their health records, reminders, and more.
          </p>
          <Link href="/dashboard/pets/new"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add your first pet
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pets.map((pet) => {
            const age = pet.dateOfBirth ? petAge(pet.dateOfBirth.toISOString()) : null;
            return (
              <Link key={pet.id} href={`/dashboard/pets/${pet.id}`}
                className="group flex flex-col rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-all hover:ring-green-400 dark:hover:ring-green-600 hover:shadow-lg hover:-translate-y-0.5">
                {/* Photo */}
                <div className="mb-4 flex justify-center">
                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-green-50 dark:bg-green-900/30 text-4xl ring-2 ring-white dark:ring-gray-800 shadow-md">
                    {pet.hasPhoto
                      ? <Image src={`/api/pets/${pet.id}/photo`} alt={pet.name} fill className="object-cover" unoptimized />
                      : <span>{speciesEmoji(pet.species)}</span>}
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-base">{pet.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {pet.breed ?? pet.species.charAt(0) + pet.species.slice(1).toLowerCase()}
                  </p>
                  {(age || pet.sex) && (
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                      {[age, pet.sex ? (pet.sex === "MALE" ? "Male" : "Female") : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                {/* CTA */}
                <div className="mt-4 flex h-8 items-center justify-center gap-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors group-hover:bg-green-50 dark:group-hover:bg-green-900/30 group-hover:text-green-700 dark:group-hover:text-green-400">
                  View profile
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </div>
              </Link>
            );
          })}

          {/* Add Pet card */}
          <Link href="/dashboard/pets/new"
            className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 min-h-[192px]">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-600 dark:group-hover:text-green-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            </div>
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 transition-colors group-hover:text-green-700 dark:group-hover:text-green-400">Add a Pet</p>
          </Link>
        </div>
      )}
    </div>
  );
}
