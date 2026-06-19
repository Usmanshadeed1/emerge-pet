"use client";

import { useState } from "react";

interface HealthRecord {
  id:          string;
  type:        string;
  title:       string;
  date:        string | null;
  nextDueDate: string | null;
  vetName:     string | null;
  clinicName:  string | null;
  dosage:      string | null;
  notes:       string | null;
  source:      string;
  normalizedDrugName: string | null;
}

interface Pet {
  id:           string;
  name:         string;
  species:      string;
  breed:        string | null;
  dateOfBirth:  string | null;
  weight:       number | null;
  weightUnit:   string;
  color:        string | null;
  microchipId:  string | null;
  sex:          string | null;
  isNeutered:   boolean;
  specialNotes: string | null;
  hasPhoto:     boolean;
  healthRecords: HealthRecord[];
}

const RECORD_LABELS: Record<string, string> = {
  VACCINATION: "Vaccinations",
  MEDICATION:  "Medications",
  VET_VISIT:   "Vet Visits",
  SURGERY:     "Surgeries",
  LAB_RESULT:  "Lab Results",
  DENTAL:      "Dental",
  GROOMING:    "Grooming",
  OTHER:       "Other",
};

const SOURCE_BADGE: Record<string, string> = {
  VET_PUSHED:       "bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200",
  CLINIC_UPLOADED:  "bg-purple-100 dark:bg-purple-900/30 text-purple-700 border-purple-200",
  AI_EXTRACTED:     "bg-amber-100 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  MANUAL:           "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export default function VetPortalPage() {
  const [code,         setCode]         = useState("");
  const [verifying,    setVerifying]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [pet,          setPet]          = useState<Pet | null>(null);
  const [vetAccessId,  setVetAccessId]  = useState<string | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  // Visit note form fields
  const [complaint,     setComplaint]     = useState("");
  const [diagnosis,     setDiagnosis]     = useState("");
  const [treatments,    setTreatments]    = useState("");
  const [discharge,     setDischarge]     = useState("");

  async function verify() {
    if (!code.trim()) return;
    setVerifying(true);
    setError(null);
    try {
      const res  = await fetch("/api/vet-portal/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code.");
      setPet(data.pet);
      setVetAccessId(data.vetAccessId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or revoked access code.");
    } finally {
      setVerifying(false);
    }
  }

  async function submitNote() {
    if (!vetAccessId) return;
    setSubmitting(true);
    try {
      const res  = await fetch("/api/vet-portal/submit-note", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          vetAccessId,
          chiefComplaint:       complaint,
          diagnosis,
          treatments,
          dischargeInstructions: discharge,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed.");
      setSubmitted(true);
      setShowForm(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to submit note.");
    } finally {
      setSubmitting(false);
    }
  }

  // Group records by type
  const grouped: Record<string, HealthRecord[]> = {};
  if (pet) {
    for (const r of pet.healthRecords) {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    }
  }

  const speciesEmoji: Record<string, string> = {
    DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
    FISH: "🐠", REPTILE: "🦎", HAMSTER: "🐹", OTHER: "🐾",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-sm">🐾</span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">EmergePet — Vet Portal</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Secure read-only access for veterinary professionals</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Code entry */}
        {!pet && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Access Pet Records</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter the 8-character access code provided by the pet owner.</p>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="e.g. A3F9B21C"
                maxLength={8}
                className="flex-1 font-mono text-lg rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
              />
              <button
                onClick={verify}
                disabled={verifying || code.trim().length < 8}
                className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {verifying ? "…" : "Access Records"}
              </button>
            </div>
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Pet profile + records */}
        {pet && (
          <>
            {/* Pet card */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-3xl">
                  {pet.hasPhoto
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`/api/pets/${pet.id}/photo`} alt={pet.name} className="h-full w-full object-cover" />
                    : speciesEmoji[pet.species] ?? "🐾"
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{pet.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pet.species.charAt(0) + pet.species.slice(1).toLowerCase()}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {pet.sex     && <span>{pet.sex.charAt(0) + pet.sex.slice(1).toLowerCase()}{pet.isNeutered ? " (neutered)" : ""}</span>}
                    {pet.weight  && <span>{pet.weight} {pet.weightUnit.toLowerCase()}</span>}
                    {pet.color   && <span>{pet.color}</span>}
                    {pet.microchipId && <span>Chip: <span className="font-mono">{pet.microchipId}</span></span>}
                  </div>
                </div>
              </div>
              {pet.specialNotes && (
                <div className="border-t border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-3">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">⚠ Special Notes</p>
                  <p className="text-sm text-amber-900">{pet.specialNotes}</p>
                </div>
              )}
            </div>

            {/* Submit Visit Note */}
            {submitted ? (
              <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800 px-5 py-4 flex items-center gap-3">
                <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Visit note submitted successfully. The owner has been notified.</p>
              </div>
            ) : showForm ? (
              <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-5 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Submit Visit Note</h3>
                {[
                  { label: "Chief Complaint", value: complaint,  set: setComplaint,  ph: "What brought the pet in today?" },
                  { label: "Diagnosis",       value: diagnosis,  set: setDiagnosis,  ph: "Your clinical diagnosis" },
                  { label: "Treatments Given", value: treatments, set: setTreatments, ph: "Medications administered, procedures performed…" },
                  { label: "Discharge Instructions", value: discharge, set: setDischarge, ph: "Instructions for the owner to follow at home" },
                ].map(({ label, value, set, ph }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <textarea value={value} onChange={(e) => set(e.target.value)} rows={3} placeholder={ph}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition">
                    Cancel
                  </button>
                  <button onClick={submitNote} disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60">
                    {submitting ? "Submitting…" : "Submit Note"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-green-300 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-50 dark:bg-green-900/20 transition flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Submit Visit Note
              </button>
            )}

            {/* Health records */}
            {Object.entries(grouped).map(([type, records]) => (
              <div key={type} className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {RECORD_LABELS[type] ?? type}
                  </h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {records.map((r) => (
                    <div key={r.id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {r.normalizedDrugName ? `${r.normalizedDrugName} (${r.title})` : r.title}
                            </p>
                            {r.source !== "MANUAL" && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SOURCE_BADGE[r.source] ?? SOURCE_BADGE.MANUAL}`}>
                                {r.source === "VET_PUSHED" ? "Vet Pushed" : r.source === "CLINIC_UPLOADED" ? "Clinic" : "AI"}
                              </span>
                            )}
                          </div>
                          {r.dosage    && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dosage: {r.dosage}</p>}
                          {r.vetName   && <p className="text-xs text-gray-500 dark:text-gray-400">{r.vetName}{r.clinicName ? ` · ${r.clinicName}` : ""}</p>}
                          {r.notes     && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{r.notes}</p>}
                          {r.nextDueDate && <p className="text-xs text-amber-600 font-medium mt-1">Next due: {new Date(r.nextDueDate).toLocaleDateString()}</p>}
                        </div>
                        {r.date && <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{new Date(r.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {pet.healthRecords.length === 0 && (
              <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 px-5 py-10 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">No health records on file yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
