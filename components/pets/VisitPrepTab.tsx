"use client";

import { useState } from "react";

interface VisitPrepResult {
  currentConcerns:     string[];
  activeMedications:   string[];
  questionsForVet:     string[];
  upcomingCare:        string[];
  recentLabHighlights: string[];
}

interface Section {
  key:   keyof VisitPrepResult;
  label: string;
  icon:  string;
  color: string;
}

const SECTIONS: Section[] = [
  { key: "currentConcerns",     label: "Current Concerns",     icon: "🩺", color: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"     },
  { key: "activeMedications",   label: "Active Medications",   icon: "💊", color: "border-blue-200 bg-blue-50 dark:bg-blue-900/20"   },
  { key: "questionsForVet",     label: "Questions for Vet",    icon: "❓", color: "border-purple-200 bg-purple-50 dark:bg-purple-900/20"},
  { key: "upcomingCare",        label: "Upcoming Care",        icon: "📅", color: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"},
  { key: "recentLabHighlights", label: "Lab Highlights",       icon: "🔬", color: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"  },
];

interface Props {
  petId:   string;
  petName: string;
}

export function VisitPrepTab({ petId, petName }: Props) {
  const [result,  setResult]  = useState<VisitPrepResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [copied,  setCopied]  = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/ai/visit-prep/${petId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      setResult(data as VisitPrepResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function buildShareText(r: VisitPrepResult): string {
    const lines: string[] = [`Visit Prep Summary for ${petName}`, ""];
    SECTIONS.forEach(({ key, label }) => {
      lines.push(`== ${label} ==`);
      const items = r[key];
      if (items.length === 0) {
        lines.push("  None");
      } else {
        items.forEach((item) => lines.push(`  • ${item}`));
      }
      lines.push("");
    });
    return lines.join("\n");
  }

  async function share() {
    if (!result) return;
    await navigator.clipboard.writeText(buildShareText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4 text-3xl">
          📋
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Visit Prep</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Generate a personalised vet-visit summary using {petName}&apos;s full health history, active medications, and upcoming care schedule.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 mb-4">
            {error}
          </p>
        )}
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            "Generate Visit Prep"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Visit Prep for {petName}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition"
          >
            {copied ? "✓ Copied!" : "Share"}
          </button>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                Regenerating…
              </>
            ) : (
              "Regenerate"
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="grid gap-3">
        {SECTIONS.map(({ key, label, icon, color }) => (
          <div key={key} className={`rounded-xl border p-4 ${color}`}>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-1.5">
              <span>{icon}</span>
              {label}
            </h4>
            {result[key].length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nothing to report.</p>
            ) : (
              <ul className="space-y-1">
                {result[key].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
