"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type UrgencyLevel = "URGENT" | "MONITOR" | "NON_URGENT";

interface SymptomResult {
  urgencyLevel:       UrgencyLevel;
  summary:            string;
  reasoning:          string;
  recommendedActions: string[];
}

interface Clinic {
  placeId:       string;
  name:          string;
  address:       string;
  distance:      number;
  rating:        number | null;
  isOpenNow:     boolean | null;
  lat:           number;
  lng:           number;
  directionsUrl: string;
}

interface Pet {
  id:      string;
  name:    string;
  species: string;
}

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY = {
  URGENT: {
    bg:      "bg-red-50 dark:bg-red-900/20",
    border:  "border-red-200 dark:border-red-800",
    badge:   "bg-red-600 text-white",
    icon:    "🚨",
    label:   "URGENT — See a Vet Now",
    text:    "text-red-800",
    subtext: "text-red-600",
  },
  MONITOR: {
    bg:      "bg-orange-50",
    border:  "border-orange-200",
    badge:   "bg-orange-500 text-white",
    icon:    "⚠️",
    label:   "MONITOR — Schedule a Vet Visit Soon",
    text:    "text-orange-800",
    subtext: "text-orange-600",
  },
  NON_URGENT: {
    bg:      "bg-green-50 dark:bg-green-900/20",
    border:  "border-green-200 dark:border-green-800",
    badge:   "bg-green-600 text-white",
    icon:    "✅",
    label:   "NON-URGENT — Manageable at Home",
    text:    "text-green-800 dark:text-green-300",
    subtext: "text-green-600",
  },
};

// ─── Locked state for free users ──────────────────────────────────────────────

function LockedState() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
          <span className="text-4xl">🔒</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h2>
      <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
        Get instant AI-powered urgency assessments for your pet&apos;s symptoms — and find emergency vets nearby if needed.
      </p>

      <div className="mt-8 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 text-left space-y-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">What you get with Premium:</p>
        {[
          "Unlimited symptom assessments",
          "URGENT / MONITOR / NON-URGENT triage",
          "Step-by-step recommended actions",
          "Nearby emergency vet clinics map for URGENT cases",
          "Plus: Health Score, QR Code, Rewards",
        ].map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-xs text-green-700 dark:text-green-400">✓</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/upgrade"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-all"
      >
        Upgrade to Premium
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Clinic card ──────────────────────────────────────────────────────────────

function ClinicCard({ clinic }: { clinic: Clinic }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{clinic.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{clinic.address}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{clinic.distance} mi</span>
          {clinic.isOpenNow !== null && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              clinic.isOpenNow ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 text-red-700 dark:text-red-400"
            }`}>
              {clinic.isOpenNow ? "Open now" : "Closed"}
            </span>
          )}
        </div>
      </div>
      {clinic.rating && (
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-xs">{"★".repeat(Math.round(clinic.rating))}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{clinic.rating.toFixed(1)}</span>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <a
          href={clinic.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl bg-green-600 py-2 text-center text-xs font-semibold text-white hover:bg-green-500 transition-all"
        >
          Directions
        </a>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(clinic.name + " vet phone")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition-all"
        >
          Find Phone
        </a>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SymptomCheckerClient({
  isPremium,
  pets,
}: {
  isPremium: boolean;
  pets:      Pet[];
}) {
  const [petId,        setPetId]        = useState<string>("");
  const [symptoms,     setSymptoms]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState<SymptomResult | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [clinics,      setClinics]      = useState<Clinic[]>([]);
  const [clinicLoad,   setClinicLoad]   = useState(false);
  const [clinicError,  setClinicError]  = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setClinics([]);
    setClinicError(null);
    setLocationDenied(false);

    const res  = await fetch("/api/ai/symptom-check", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ petId: petId || undefined, symptomText: symptoms }),
    });
    const data = await res.json() as SymptomResult & { error?: string };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Analysis failed. Please try again.");
      return;
    }

    setResult(data);

    // Auto-fetch nearby clinics for URGENT results
    if (data.urgencyLevel === "URGENT") {
      fetchNearbyClinics();
    }
  }

  function fetchNearbyClinics() {
    if (!navigator.geolocation) {
      setClinicError("Geolocation is not supported by your browser.");
      return;
    }

    setClinicLoad(true);
    setClinicError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const res  = await fetch(`/api/clinics/nearby?lat=${lat}&lng=${lng}`);
        const data = await res.json() as { clinics?: Clinic[]; error?: string };
        setClinicLoad(false);
        if (res.ok && data.clinics) {
          setClinics(data.clinics);
        } else {
          setClinicError(data.error ?? "Could not load nearby clinics.");
        }
      },
      () => {
        setClinicLoad(false);
        setLocationDenied(true);
      }
    );
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setSymptoms("");
    setPetId("");
    setClinics([]);
    setClinicError(null);
    setLocationDenied(false);
  }

  if (!isPremium) return <LockedState />;

  const urgency = result ? URGENCY[result.urgencyLevel] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Describe your pet&apos;s symptoms and get an instant AI urgency assessment.
        </p>
      </div>

      {/* Input form — hidden after result */}
      {!result && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-5">
          {/* Pet selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Which pet? <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white dark:bg-gray-900 transition-all"
            >
              <option value="">General — not specific to one pet</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species.charAt(0) + p.species.slice(1).toLowerCase()})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Selecting a pet gives the AI context about species, age, weight, and medications.

            </p>
          </div>

          {/* Symptom input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Describe the symptoms
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={5}
              placeholder="e.g. My dog has been vomiting this morning and seems lethargic. Not eating, stomach looks bloated..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Be as detailed as possible — when it started, how severe, any other changes in behaviour.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !symptoms.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Analysing symptoms…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01-.659 1.591l-1.591 1.591a2.25 2.25 0 01-1.591.659H7.24a2.25 2.25 0 01-1.591-.659l-1.591-1.591A2.25 2.25 0 013.4 15m16.4 0l-6.772-6.772a2.25 2.25 0 00-3.256 0L3.4 15" />
                </svg>
                Analyse Symptoms
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            This tool provides urgency guidance only — it is not a substitute for professional veterinary advice.
          </p>
        </form>
      )}

      {/* Result */}
      {result && urgency && (
        <div className="space-y-5">
          {/* Urgency banner */}
          <div className={`rounded-2xl border p-6 ${urgency.bg} ${urgency.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{urgency.icon}</span>
              <span className={`rounded-xl px-4 py-1.5 text-sm font-bold ${urgency.badge}`}>
                {urgency.label}
              </span>
            </div>
            <p className={`text-base font-medium leading-relaxed ${urgency.text}`}>
              {result.summary}
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${urgency.subtext}`}>
              {result.reasoning}
            </p>
          </div>

          {/* Recommended actions */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recommended Actions</h2>
            <ol className="space-y-3">
              {result.recommendedActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{action}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nearby clinics — URGENT only */}
          {result.urgencyLevel === "URGENT" && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Nearby Emergency Vets</h2>
                {!clinicLoad && clinics.length === 0 && !clinicError && !locationDenied && (
                  <button
                    onClick={fetchNearbyClinics}
                    className="text-xs font-medium text-green-700 dark:text-green-400 hover:underline"
                  >
                    Find clinics near me
                  </button>
                )}
              </div>

              {clinicLoad && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="h-4 w-4 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Finding emergency vets near you…
                </div>
              )}

              {locationDenied && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
                  Location access was denied. Please allow location access and{" "}
                  <button onClick={fetchNearbyClinics} className="font-semibold underline">try again</button>, or search Google Maps for nearby emergency vets.
                </div>
              )}

              {clinicError && !locationDenied && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
                  {clinicError}
                </div>
              )}

              {clinics.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {clinics.map((c) => (
                    <ClinicCard key={c.placeId} clinic={c} />
                  ))}
                </div>
              )}

              {!clinicLoad && clinics.length === 0 && !clinicError && !locationDenied && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Allow location access above to see emergency vet clinics near you.
                </p>
              )}
            </div>
          )}

          {/* Start new assessment */}
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.990" />
            </svg>
            Start New Assessment
          </button>
        </div>
      )}
    </div>
  );
}
