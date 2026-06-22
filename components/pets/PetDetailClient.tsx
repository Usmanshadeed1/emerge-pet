"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { speciesEmoji, formatSpecies, petAge, formatWeight } from "@/lib/utils";
import RecordsTab from "@/components/pets/records/RecordsTab";
import PetRemindersTab from "@/components/pets/PetRemindersTab";
import BreedGuideTab from "@/components/pets/BreedGuideTab";
import { AIToolsTab } from "@/components/pets/AIToolsTab";
import { QrCodeTab } from "@/components/pets/QrCodeTab";
import { VetAccessTab } from "@/components/pets/VetAccessTab";

type Tab = "overview" | "records" | "reminders" | "breed" | "ai" | "qr" | "vet";

interface Pet {
  id:           string;
  name:         string;
  species:      string;
  breed:        string | null;
  dateOfBirth:  string | null;
  weight:       number | null;
  weightUnit:   string;
  color:        string | null;
  markings:     string | null;
  microchipId:  string | null;
  sex:          string | null;
  isNeutered:   boolean;
  specialNotes: string | null;
  hasPhoto:     boolean;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview",  label: "Overview",  icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
  { key: "records",   label: "Records",   icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
  { key: "reminders", label: "Reminders", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg> },
  { key: "breed",     label: "Breed",      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
  { key: "ai",        label: "AI Tools",  icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg> },
  { key: "qr",        label: "QR Code",   icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" /></svg> },
  { key: "vet",       label: "Vet",        icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg> },
];


export default function PetDetailClient({ pet, isPremium }: { pet: Pet; isPremium: boolean }) {
  const router              = useRouter();
  const searchParams        = useSearchParams();
  const initialTab          = (searchParams.get("tab") as Tab) ?? "overview";
  const [tab, setTab]       = useState<Tab>(initialTab);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const age    = petAge(pet.dateOfBirth);
  const weight = formatWeight(pet.weight, pet.weightUnit);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/pets/${pet.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "Failed to delete pet.");
      setDeleting(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl anim-fade-in">
      {/* Back */}
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        All pets
      </Link>

      {/* ── Hero Card ── */}
      <div className="mb-6 rounded-2xl bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-50 dark:bg-green-900/20 text-4xl ring-2 ring-green-100 dark:ring-green-900 shadow-md">
            {pet.hasPhoto
              ? <Image src={`/api/pets/${pet.id}/photo`} alt={pet.name} fill className="object-cover" unoptimized />
              : <span>{speciesEmoji(pet.species)}</span>}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name + action buttons row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{pet.name}</h1>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                  {[pet.breed, formatSpecies(pet.species)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Link href={`/dashboard/pets/${pet.id}/edit`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  Edit
                </Link>
                <button onClick={() => setShowDelete(true)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-2.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {age    && <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-green-100 dark:ring-green-900">🎂 {age}</span>}
              {weight && <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900">⚖️ {weight}</span>}
              {pet.sex && <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-400 ring-1 ring-purple-100 dark:ring-purple-900">{pet.sex === "MALE" ? "♂ Male" : "♀ Female"}</span>}
              {pet.isNeutered && <span className="inline-flex items-center rounded-lg bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400 ring-1 ring-orange-100 dark:ring-orange-900">✂️ Neutered</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-4 rounded-xl bg-white dark:bg-gray-900 p-1 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
        {/* Mobile: scrollable row */}
        <div className="flex gap-0.5 overflow-x-auto scrollbar-hide sm:hidden">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                tab === key
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
        {/* Desktop: equal-width buttons with icons */}
        <div className="hidden sm:flex gap-0.5">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-all ${
                tab === key
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="anim-fade-in">
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h3>
                {[
                  { label: "Species",   value: formatSpecies(pet.species) },
                  { label: "Breed",     value: pet.breed },
                  { label: "Birthday",  value: pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null },
                  { label: "Age",       value: age },
                  { label: "Color",     value: pet.color },
                  { label: "Markings",  value: pet.markings },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ) : null)}
              </div>

              <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Medical</h3>
                {[
                  { label: "Weight",     value: weight },
                  { label: "Sex",        value: pet.sex ? (pet.sex === "MALE" ? "Male" : "Female") : null },
                  { label: "Neutered",   value: pet.isNeutered ? "Yes" : "No" },
                  { label: "Microchip",  value: pet.microchipId },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ) : null)}
                {pet.specialNotes && (
                  <div className="pt-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Special notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{pet.specialNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "records" && (
          <RecordsTab petId={pet.id} species={pet.species} petName={pet.name} />
        )}
        {tab === "reminders" && <PetRemindersTab petId={pet.id} petName={pet.name} />}
        {tab === "breed" && <BreedGuideTab petId={pet.id} breed={pet.breed} species={pet.species} />}
        {tab === "ai"        && <AIToolsTab petId={pet.id} petName={pet.name} isPremium={isPremium} />}
        {tab === "qr"        && <QrCodeTab petId={pet.id} petName={pet.name} isPremium={isPremium} />}
        {tab === "vet"       && <VetAccessTab petId={pet.id} petName={pet.name} />}
      </div>

      {/* ── Delete Modal ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 anim-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-100 dark:ring-red-900 text-2xl">{speciesEmoji(pet.species)}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete {pet.name}?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This will permanently delete {pet.name} and all their health records, vaccines, and reminders. This cannot be undone.
            </p>
            {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDelete(false)}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-50">
                {deleting && <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
