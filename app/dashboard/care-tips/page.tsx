"use client";

import { useState, useEffect, useMemo } from "react";
import { CARE_TIPS, getTipsForSpecies, CATEGORIES, type CareTip } from "@/lib/care-tips";

interface Pet { id: string; name: string; species: string }

const CATEGORY_COLORS: Record<string, string> = {
  "Dental Care":      "bg-sky-50   text-sky-700   ring-sky-100",
  "Exercise":         "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-100 dark:ring-green-900",
  "Nutrition":        "bg-orange-50 text-orange-700 ring-orange-100",
  "Safety":           "bg-red-50 dark:bg-red-900/20   text-red-700 dark:text-red-400   ring-red-100 dark:ring-red-900",
  "Behavior":         "bg-violet-50 text-violet-700 ring-violet-100",
  "Senior Care":      "bg-amber-50 dark:bg-amber-900/20  text-amber-700 dark:text-amber-400  ring-amber-100 dark:ring-amber-900",
  "Preventive Care":  "bg-teal-50  text-teal-700  ring-teal-100",
  "Environment":      "bg-lime-50  text-lime-700  ring-lime-100",
  "Mental Health":    "bg-pink-50  text-pink-700  ring-pink-100",
  "Grooming":         "bg-purple-50 dark:bg-purple-900/20 text-purple-700 ring-purple-100",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-gray-200 dark:ring-gray-700";
}

function TipCard({ tip }: { tip: CareTip }) {
  const [open, setOpen] = useState(false);
  const catCls = categoryColor(tip.category);

  // Render markdown-ish content (bold with **text**)
  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
        return (
          <p key={i} className="mt-4 mb-1 text-sm font-bold text-gray-900 dark:text-white">
            {line.slice(2, -2)}
          </p>
        );
      }
      // Inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${line === "" ? "mt-2" : ""}`}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className="font-semibold text-gray-800 dark:text-gray-100">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    });
  }

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-gray-900 ring-1 transition-all duration-200 overflow-hidden ${
        open ? "ring-green-300 shadow-md" : "ring-gray-200 dark:ring-gray-700 hover:ring-gray-300 hover:shadow-sm"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0 mt-0.5">{tip.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{tip.title}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tip.summary}</p>
              <span className={`mt-2 inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ${catCls}`}>
                {tip.category}
              </span>
            </div>
          </div>
          <svg
            className={`h-4 w-4 flex-shrink-0 mt-1 text-gray-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-0.5">
            {renderContent(tip.content)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CareTipsPage() {
  const [pets,           setPets]           = useState<Pet[]>([]);
  const [selectedPetId,  setSelectedPetId]  = useState<string>("all");
  const [selectedCat,    setSelectedCat]    = useState<string>("all");
  const [search,         setSearch]         = useState("");

  useEffect(() => {
    fetch("/api/pets")
      .then((r) => r.json())
      .then((d: { pets: Pet[] }) => setPets(d.pets ?? []))
      .catch(() => {});
  }, []);

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  const filtered = useMemo(() => {
    let tips: CareTip[];

    if (selectedPet) {
      tips = getTipsForSpecies(selectedPet.species);
    } else {
      tips = CARE_TIPS;
    }

    if (selectedCat !== "all") {
      tips = tips.filter((t) => t.category === selectedCat);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      tips = tips.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    return tips;
  }, [selectedPet, selectedCat, search]);

  const speciesLabel = selectedPet
    ? `${selectedPet.name} (${selectedPet.species.charAt(0) + selectedPet.species.slice(1).toLowerCase()})`
    : "All pets";

  return (
    <div className="space-y-6 anim-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Care Tips</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {CARE_TIPS.length} expert-written articles · filtered to {speciesLabel}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pet selector */}
        <div className="relative">
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-3.5 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
          >
            <option value="all">All species</option>
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-3.5 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tips…"
            className="h-9 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3.5 text-sm text-gray-700 dark:text-gray-300 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
          />
        </div>

        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} tip{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Category pills */}
      {selectedCat !== "all" && (
        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-3 py-1 text-sm font-medium ring-1 ${categoryColor(selectedCat)}`}>
            {selectedCat}
          </span>
          <button onClick={() => setSelectedCat("all")} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 underline">
            Clear filter
          </button>
        </div>
      )}

      {/* Tips grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-16 text-center">
          <span className="mb-3 text-4xl">🔍</span>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No tips found</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}
