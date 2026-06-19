"use client";

import { useState } from "react";

type RecordType = "VACCINATION" | "MEDICATION" | "VET_VISIT" | "LAB_RESULT" | "SURGERY" | "OTHER";

interface FormData {
  type:        RecordType;
  title:       string;
  date:        string;
  nextDueDate: string;
  vetName:     string;
  clinicName:  string;
  dosage:      string;
  notes:       string;
}

interface AddRecordModalProps {
  petId:    string;
  onClose:  () => void;
  onSaved:  () => void;
  initial?: Partial<FormData & { id: string }>;
}

const TYPE_CONFIG: Record<RecordType, { label: string; emoji: string; color: string; fields: string[] }> = {
  VACCINATION: {
    label:  "Vaccination",
    emoji:  "💉",
    color:  "bg-blue-50 dark:bg-blue-900/20 ring-blue-100 text-blue-700",
    fields: ["title", "date", "nextDueDate", "vetName", "clinicName", "notes"],
  },
  MEDICATION: {
    label:  "Medication",
    emoji:  "💊",
    color:  "bg-purple-50 dark:bg-purple-900/20 ring-purple-100 text-purple-700",
    fields: ["title", "date", "dosage", "vetName", "clinicName", "notes"],
  },
  VET_VISIT: {
    label:  "Vet Visit",
    emoji:  "🏥",
    color:  "bg-green-50 dark:bg-green-900/20 ring-green-100 dark:ring-green-900 text-green-700 dark:text-green-400",
    fields: ["title", "date", "vetName", "clinicName", "notes"],
  },
  LAB_RESULT: {
    label:  "Lab Result",
    emoji:  "🔬",
    color:  "bg-yellow-50 dark:bg-yellow-900/20 ring-yellow-100 text-yellow-700",
    fields: ["title", "date", "vetName", "clinicName", "notes"],
  },
  SURGERY: {
    label:  "Surgery",
    emoji:  "🩺",
    color:  "bg-red-50 dark:bg-red-900/20 ring-red-100 dark:ring-red-900 text-red-700 dark:text-red-400",
    fields: ["title", "date", "vetName", "clinicName", "notes"],
  },
  OTHER: {
    label:  "Other",
    emoji:  "📋",
    color:  "bg-gray-50 dark:bg-gray-800 ring-gray-200 dark:ring-gray-700 text-gray-700 dark:text-gray-300",
    fields: ["title", "date", "vetName", "clinicName", "notes"],
  },
};

const TYPES = Object.keys(TYPE_CONFIG) as RecordType[];

const DEFAULT_TITLES: Record<RecordType, string> = {
  VACCINATION: "",
  MEDICATION:  "",
  VET_VISIT:   "Wellness exam",
  LAB_RESULT:  "Blood work",
  SURGERY:     "",
  OTHER:       "",
};

export default function AddRecordModal({ petId, onClose, onSaved, initial }: AddRecordModalProps) {
  const isEdit = !!initial?.id;

  const [step,    setStep]    = useState<"type" | "form">(isEdit ? "form" : "type");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState<FormData>({
    type:        initial?.type        ?? "VET_VISIT",
    title:       initial?.title       ?? "",
    date:        initial?.date        ?? "",
    nextDueDate: initial?.nextDueDate ?? "",
    vetName:     initial?.vetName     ?? "",
    clinicName:  initial?.clinicName  ?? "",
    dosage:      initial?.dosage      ?? "",
    notes:       initial?.notes       ?? "",
  });

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  function selectType(type: RecordType) {
    setForm((f) => ({
      ...f,
      type,
      title: f.title || DEFAULT_TITLES[type],
    }));
    setStep("form");
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");

    const url    = isEdit
      ? `/api/pets/${petId}/records/${initial!.id}`
      : `/api/pets/${petId}/records`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        form.type,
        title:       form.title.trim(),
        date:        form.date        || null,
        nextDueDate: form.nextDueDate || null,
        vetName:     form.vetName     || null,
        clinicName:  form.clinicName  || null,
        dosage:      form.dosage      || null,
        notes:       form.notes       || null,
      }),
    });

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to save record.");
    }
    setSaving(false);
  }

  const cfg = TYPE_CONFIG[form.type];
  const hasField = (f: string) => cfg.fields.includes(f);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden anim-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
          <div className="flex items-center gap-2">
            {step === "form" && !isEdit && (
              <button
                onClick={() => setStep("type")}
                className="mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </button>
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {isEdit ? `Edit ${cfg.label}` : step === "type" ? "Add Record" : `New ${cfg.label}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Step 1 — Type selector */}
        {step === "type" && (
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
            {TYPES.map((t) => {
              const c = TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => selectType(t)}
                  className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center ring-1 transition-all hover:scale-[1.02] hover:shadow-sm ${c.color}`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2 — Form */}
        {step === "form" && (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-4 p-5">
              {/* Type badge */}
              <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium ring-1 ${cfg.color}`}>
                <span>{cfg.emoji}</span>
                {cfg.label}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.type === "VACCINATION" ? "Vaccine name" :
                   form.type === "MEDICATION"  ? "Drug / medication name" :
                   form.type === "VET_VISIT"   ? "Visit type" :
                   form.type === "LAB_RESULT"  ? "Test name" :
                   form.type === "SURGERY"     ? "Procedure name" : "Title"}
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={
                    form.type === "VACCINATION" ? "e.g. Rabies, DHPP, Bordetella" :
                    form.type === "MEDICATION"  ? "e.g. Rimadyl, Apoquel" :
                    form.type === "VET_VISIT"   ? "e.g. Annual wellness exam" :
                    form.type === "LAB_RESULT"  ? "e.g. CBC, Urinalysis, X-ray" :
                    form.type === "SURGERY"     ? "e.g. Spay, Dental cleaning" :
                    "Title"
                  }
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                  autoFocus
                />
              </div>

              {/* Date */}
              <div className={`grid gap-4 ${hasField("nextDueDate") ? "sm:grid-cols-2" : ""}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {form.type === "VACCINATION" ? "Date administered" : "Date"}
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                  />
                </div>
                {hasField("nextDueDate") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next due date</label>
                    <input
                      type="date"
                      value={form.nextDueDate}
                      onChange={(e) => set("nextDueDate", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                    />
                  </div>
                )}
              </div>

              {/* Dosage */}
              {hasField("dosage") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={form.dosage}
                    onChange={(e) => set("dosage", e.target.value)}
                    placeholder="e.g. 75mg twice daily"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                  />
                </div>
              )}

              {/* Vet + Clinic */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vet name</label>
                  <input
                    type="text"
                    value={form.vetName}
                    onChange={(e) => set("vetName", e.target.value)}
                    placeholder="Dr. Smith"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinic / hospital</label>
                  <input
                    type="text"
                    value={form.clinicName}
                    onChange={(e) => set("clinicName", e.target.value)}
                    placeholder="City Animal Clinic"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  placeholder="Any additional details…"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900 resize-none"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {step === "form" && (
          <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
            <button
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              )}
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add record"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
