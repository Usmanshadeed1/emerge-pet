"use client";

import { useState } from "react";

type ReminderType = "VET_APPOINTMENT" | "MEDICATION" | "GROOMING" | "VACCINATION" | "CUSTOM";

interface Pet { id: string; name: string; species: string }

interface FormData {
  title:     string;
  type:      ReminderType;
  petId:     string;
  dueDate:   string;
  dueTime:   string;
  frequency: string;
  notes:     string;
}

interface AddReminderModalProps {
  pets:     Pet[];
  onClose:  () => void;
  onSaved:  () => void;
  initial?: Partial<FormData & { id: string; petId: string }>;
  defaultPetId?: string;
}

const TYPE_CONFIG: Record<ReminderType, { label: string; emoji: string; color: string }> = {
  VET_APPOINTMENT: { label: "Vet Appointment", emoji: "🏥", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 ring-blue-100" },
  MEDICATION:      { label: "Medication",       emoji: "💊", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 ring-purple-100" },
  GROOMING:        { label: "Grooming",         emoji: "✂️", color: "bg-orange-50 text-orange-700 ring-orange-100" },
  VACCINATION:     { label: "Vaccination",      emoji: "💉", color: "bg-teal-50 text-teal-700 ring-teal-100" },
  CUSTOM:          { label: "Custom",           emoji: "📌", color: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-700" },
};

const FREQUENCIES = [
  "Once Daily",
  "Twice Daily",
  "Three Times Daily",
  "Every 8 Hours",
  "Weekly",
  "Monthly",
  "As Needed",
];

const TYPES = Object.keys(TYPE_CONFIG) as ReminderType[];

export default function AddReminderModal({
  pets, onClose, onSaved, initial, defaultPetId,
}: AddReminderModalProps) {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<FormData>({
    title:     initial?.title     ?? "",
    type:      initial?.type      ?? "VET_APPOINTMENT",
    petId:     initial?.petId     ?? defaultPetId ?? pets[0]?.id ?? "",
    dueDate:   initial?.dueDate   ?? "",
    dueTime:   initial?.dueTime   ?? "",
    frequency: initial?.frequency ?? "",
    notes:     initial?.notes     ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSave() {
    if (!form.title.trim() || !form.petId || !form.dueDate) {
      setError("Title, pet, and due date are required.");
      return;
    }
    setSaving(true);
    setError("");

    const url    = isEdit
      ? `/api/pets/${form.petId}/reminders/${initial!.id}`
      : `/api/pets/${form.petId}/reminders`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:     form.title.trim(),
        type:      form.type,
        dueDate:   form.dueDate,
        dueTime:   form.dueTime   || null,
        frequency: form.frequency || null,
        notes:     form.notes     || null,
      }),
    });

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to save reminder.");
    }
    setSaving(false);
  }

  const cfg = TYPE_CONFIG[form.type];
  const showFrequency = form.type === "MEDICATION";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden anim-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Edit Reminder" : "Add Reminder"}
          </h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="space-y-4 p-5">

            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {TYPES.map((t) => {
                  const c = TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("type", t)}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center ring-1 transition-all text-xs font-medium ${
                        form.type === t
                          ? `${c.color} ring-2`
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ring-gray-200 dark:ring-gray-700 hover:bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <span className="text-lg">{c.emoji}</span>
                      <span className="leading-tight">{c.label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${cfg.color}`}>
                {cfg.emoji} {cfg.label}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder={
                  form.type === "VET_APPOINTMENT" ? "e.g. Annual checkup" :
                  form.type === "MEDICATION"      ? "e.g. Give Rimadyl" :
                  form.type === "GROOMING"        ? "e.g. Bath & nail trim" :
                  form.type === "VACCINATION"     ? "e.g. Rabies booster" :
                  "Reminder title"
                }
                autoFocus
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
              />
            </div>

            {/* Pet selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pet <span className="text-red-500">*</span>
              </label>
              <select
                value={form.petId}
                onChange={(e) => set("petId", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="time"
                  value={form.dueTime}
                  onChange={(e) => set("dueTime", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                />
              </div>
            </div>

            {/* Frequency (medications only) */}
            {showFrequency && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => set("frequency", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                >
                  <option value="">Select frequency…</option>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Any extra details…"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900 resize-none"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
          <button onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {saving && (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            )}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}
