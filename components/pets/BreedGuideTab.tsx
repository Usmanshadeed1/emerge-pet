"use client";

import { useState, useEffect } from "react";

interface BreedGuide {
  breed:       string;
  species:     string;
  healthRisks: string;
  diet:        string;
  exercise:    string;
  grooming:    string;
  lifespan:    string;
  generatedAt: string;
}

interface Section {
  key:     keyof BreedGuide;
  label:   string;
  emoji:   string;
  color:   string;
}

const SECTIONS: Section[] = [
  { key: "healthRisks", label: "Common Health Risks",  emoji: "🩺", color: "border-l-red-400    bg-red-50 dark:bg-red-900/20/50" },
  { key: "diet",        label: "Ideal Diet",            emoji: "🥩", color: "border-l-orange-400 bg-orange-50/50" },
  { key: "exercise",    label: "Exercise Needs",        emoji: "🏃", color: "border-l-green-400  bg-green-50 dark:bg-green-900/20/50" },
  { key: "grooming",    label: "Grooming",              emoji: "✨", color: "border-l-violet-400 bg-violet-50/50" },
  { key: "lifespan",    label: "Lifespan & Longevity",  emoji: "⏳", color: "border-l-blue-400   bg-blue-50 dark:bg-blue-900/20/50" },
];

export default function BreedGuideTab({ petId, breed, species }: { petId: string; breed: string | null; species: string }) {
  const [guide,    setGuide]    = useState<BreedGuide | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [cached,   setCached]   = useState(false);
  const [error,    setError]    = useState("");

  async function load(forceRefresh = false) {
    setLoading(true);
    setError("");
    try {
      const url = `/api/pets/${petId}/breed-guide${forceRefresh ? "?refresh=1" : ""}`;
      const res  = await fetch(url);
      const data = await res.json() as { guide?: BreedGuide; cached?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load breed guide.");
      } else {
        setGuide(data.guide ?? null);
        setCached(data.cached ?? false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [petId]);

  const label = breed ? `${breed}` : species.charAt(0) + species.slice(1).toLowerCase();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="mb-4 rounded-xl border-l-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-700 mt-1.5" />
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          ✨ Generating breed guide with AI…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-3xl">🤖</div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Breed guide unavailable</h3>
        <p className="mt-2 max-w-xs mx-auto text-sm text-gray-500 dark:text-gray-400">{error}</p>
        {error.includes("AI_API_KEY") && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Add <code className="rounded bg-gray-100 dark:bg-gray-700 px-1 py-0.5">AI_API_KEY</code> to your{" "}
            <code className="rounded bg-gray-100 dark:bg-gray-700 px-1 py-0.5">.env.local</code> to enable this feature.
          </p>
        )}
        <button
          onClick={() => load()}
          className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!guide) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 ring-1 ring-green-100 dark:ring-green-900 text-2xl">🐾</div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{label} Care Guide</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {cached ? "Cached · " : "Generated · "}
              {new Date(guide.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800 transition-all"
          title="Regenerate guide"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
          Refresh
        </button>
      </div>

      {cached && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 text-xs text-green-600 ring-1 ring-green-100 dark:ring-green-900">
          ✓ Using cached guide — refreshes automatically after 30 days or when breed changes.
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map(({ key, label: sLabel, emoji, color }) => (
          <div
            key={key}
            className={`rounded-xl border-l-4 p-4 ${color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{emoji}</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{sLabel}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {guide[key] as string}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
        AI-generated content. Always consult your veterinarian for personalized advice.
      </p>
    </div>
  );
}
