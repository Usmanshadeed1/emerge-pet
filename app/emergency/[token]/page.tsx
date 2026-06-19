import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { speciesEmoji, petAge, formatWeight } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RECORD_TYPE_LABELS: Record<string, string> = {
  VACCINATION:  "Vaccinations",
  MEDICATION:   "Medications",
  VET_VISIT:    "Vet Visits",
  SURGERY:      "Surgeries",
  LAB_RESULT:   "Lab Results",
  DENTAL:       "Dental",
  GROOMING:     "Grooming",
  OTHER:        "Other Records",
};

const RECORD_TYPE_ORDER = [
  "VACCINATION", "MEDICATION", "VET_VISIT", "SURGERY",
  "LAB_RESULT", "DENTAL", "GROOMING", "OTHER",
];

export default async function EmergencyPage({
  params,
}: {
  params: { token: string };
}) {
  const pet = await db.pet.findUnique({
    where:  { qrToken: params.token },
    select: {
      id:           true,
      name:         true,
      species:      true,
      breed:        true,
      dateOfBirth:  true,
      weight:       true,
      weightUnit:   true,
      color:        true,
      markings:     true,
      microchipId:  true,
      sex:          true,
      isNeutered:   true,
      specialNotes: true,
      photoData:    true,
      healthRecords: {
        orderBy: { date: "desc" },
        select: {
          id:         true,
          type:       true,
          title:      true,
          date:       true,
          nextDueDate: true,
          vetName:    true,
          clinicName: true,
          dosage:     true,
          notes:      true,
          normalizedDrugName: true,
        },
      },
    },
  });

  if (!pet) notFound();

  // Group records by type
  const grouped: Record<string, typeof pet.healthRecords> = {};
  for (const r of pet.healthRecords) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  }

  const photoUrl = pet.photoData ? `/api/pets/${pet.id}/photo` : null;
  const age      = petAge(pet.dateOfBirth);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Emergency banner */}
      <div className="bg-red-600 px-4 py-4 text-center">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
          <svg className="h-6 w-6 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="text-left">
            <p className="text-sm font-bold tracking-widest text-white uppercase">EMERGENCY PET INFORMATION</p>
            <p className="text-xs text-red-200">Read only — provided by pet owner via EmergePet</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Pet profile card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
          <div className="flex items-start gap-4 p-6">
            {/* Photo or emoji */}
            <div className="h-20 w-20 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-4xl">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                speciesEmoji(pet.species)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pet.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {pet.species.charAt(0) + pet.species.slice(1).toLowerCase()}
                {pet.breed ? ` · ${pet.breed}` : ""}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {age && (
                  <div><span className="text-gray-400 dark:text-gray-500">Age:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{age}</span></div>
                )}
                {pet.sex && (
                  <div><span className="text-gray-400 dark:text-gray-500">Sex:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{pet.sex.charAt(0) + pet.sex.slice(1).toLowerCase()}{pet.isNeutered ? " (neutered)" : ""}</span></div>
                )}
                {pet.weight && (
                  <div><span className="text-gray-400 dark:text-gray-500">Weight:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{formatWeight(pet.weight, pet.weightUnit)}</span></div>
                )}
                {pet.color && (
                  <div><span className="text-gray-400 dark:text-gray-500">Colour:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{pet.color}</span></div>
                )}
                {pet.markings && (
                  <div className="col-span-2"><span className="text-gray-400 dark:text-gray-500">Markings:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{pet.markings}</span></div>
                )}
                {pet.microchipId && (
                  <div className="col-span-2"><span className="text-gray-400 dark:text-gray-500">Microchip:</span> <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{pet.microchipId}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Special notes — highlighted */}
          {pet.specialNotes && (
            <div className="border-t border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">⚠ Special Notes &amp; Allergies</p>
              <p className="text-sm text-amber-900 font-medium">{pet.specialNotes}</p>
            </div>
          )}
        </div>

        {/* Health records grouped by type */}
        {RECORD_TYPE_ORDER.filter((t) => grouped[t]?.length).map((type) => (
          <div key={type} className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {RECORD_TYPE_LABELS[type] ?? type}
              </h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {grouped[type].map((r) => (
                <div key={r.id} className="px-6 py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {r.normalizedDrugName ? `${r.normalizedDrugName} (${r.title})` : r.title}
                      </p>
                      {r.dosage && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dosage: {r.dosage}</p>}
                      {r.vetName && <p className="text-xs text-gray-500 dark:text-gray-400">{r.vetName}{r.clinicName ? ` · ${r.clinicName}` : ""}</p>}
                      {r.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{r.notes}</p>}
                      {r.nextDueDate && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          Next due: {new Date(r.nextDueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {r.date && (
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(r.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pet.healthRecords.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 px-6 py-10 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">No health records on file.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
          Generated by EmergePet · For emergency use only
        </p>
      </div>
    </div>
  );
}
