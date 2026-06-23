"use client";

import { useState, useEffect } from "react";

type ReminderType = "VET_APPOINTMENT" | "MEDICATION" | "GROOMING" | "VACCINATION" | "CUSTOM";

interface Pet { id: string; name: string; species: string }

interface FormData {
  title:          string;
  type:           ReminderType;
  petId:          string;
  dueDate:        string;
  frequency:      string;
  reminderTimes:  string[];
  customInterval: string;
  customUnit:     string;
  notifyBefore:   string;
  endDate:        string;
  notes:          string;
}

interface AddReminderModalProps {
  pets:         Pet[];
  onClose:      () => void;
  onSaved:      () => void;
  initial?:     Partial<FormData & { id: string; dueTime?: string }>;
  defaultPetId?: string;
}

const TYPE_CONFIG: Record<ReminderType, { label: string; emoji: string; color: string }> = {
  VET_APPOINTMENT: { label: "Vet Appointment", emoji: "🏥", color: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-blue-100 dark:ring-blue-800" },
  MEDICATION:      { label: "Medication",       emoji: "💊", color: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-purple-100 dark:ring-purple-800" },
  GROOMING:        { label: "Grooming",         emoji: "✂️", color: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-orange-100 dark:ring-orange-800" },
  VACCINATION:     { label: "Vaccination",      emoji: "💉", color: "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-teal-100 dark:ring-teal-800" },
  CUSTOM:          { label: "Custom",           emoji: "📌", color: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-700" },
};

const FREQUENCIES = [
  { value: "Once Daily",          label: "Once Daily",          times: 1,  defaults: ["08:00"] },
  { value: "Twice Daily",         label: "Twice Daily",         times: 2,  defaults: ["08:00", "20:00"] },
  { value: "Three Times Daily",   label: "Three Times Daily",   times: 3,  defaults: ["08:00", "14:00", "20:00"] },
  { value: "Every 8 Hours",       label: "Every 8 Hours",       times: 3,  defaults: ["08:00", "16:00", "00:00"] },
  { value: "Weekly",              label: "Weekly",              times: 1,  defaults: ["08:00"] },
  { value: "Monthly",             label: "Monthly",             times: 1,  defaults: ["08:00"] },
  { value: "As Needed",           label: "As Needed",           times: 0,  defaults: [] },
  { value: "Custom",              label: "Custom interval…",    times: -1, defaults: ["08:00"] },
];

const TYPES = Object.keys(TYPE_CONFIG) as ReminderType[];

function timeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AddReminderModal({
  pets, onClose, onSaved, initial, defaultPetId,
}: AddReminderModalProps) {
  const isEdit = !!initial?.id;

  // Derive initial reminderTimes from legacy dueTime if editing old reminder
  const initTimes: string[] = Array.isArray(initial?.reminderTimes) && initial.reminderTimes.length > 0
    ? initial.reminderTimes
    : initial?.dueTime ? [initial.dueTime] : [];

  const [form, setForm] = useState<FormData>({
    title:          initial?.title          ?? "",
    type:           initial?.type           ?? "VET_APPOINTMENT",
    petId:          initial?.petId          ?? defaultPetId ?? pets[0]?.id ?? "",
    dueDate:        initial?.dueDate        ?? "",
    frequency:      initial?.frequency      ?? "",
    reminderTimes:  initTimes,
    customInterval: "1",
    customUnit:     "days",
    notifyBefore:   initial?.notifyBefore   ? String(initial.notifyBefore) : "",
    endDate:        initial?.endDate        ?? "",
    notes:          initial?.notes          ?? "",
  });

  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");
  const [globalNotify,   setGlobalNotify]   = useState("60");

  // Load global notify-before default from admin settings
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: Record<string, string | null>) => {
        if (d.reminder_notify_before) setGlobalNotify(d.reminder_notify_before);
      })
      .catch(() => {});
  }, []);

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  function handleFrequencyChange(val: string) {
    const freq = FREQUENCIES.find((f) => f.value === val);
    const defaultTimes = freq && freq.times > 0 ? freq.defaults : [];
    set("frequency", val);
    set("reminderTimes", defaultTimes as string[]);
  }

  function setTime(index: number, val: string) {
    const times = [...form.reminderTimes];
    times[index] = val;
    set("reminderTimes", times);
  }

  const isMedication   = form.type === "MEDICATION";
  const freqConfig     = FREQUENCIES.find((f) => f.value === form.frequency);
  const timeCount      = freqConfig ? (freqConfig.times === -1 ? 1 : freqConfig.times) : 0;
  const isCustomFreq   = form.frequency === "Custom";

  // Effective frequency string stored in DB for custom
  function effectiveFrequency() {
    if (isCustomFreq) return `Custom|${form.customInterval}|${form.customUnit}`;
    return form.frequency || null;
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
        title:         form.title.trim(),
        type:          form.type,
        dueDate:       form.dueDate,
        frequency:     effectiveFrequency(),
        reminderTimes: isMedication ? form.reminderTimes.filter(Boolean) : [],
        notifyBefore:  isMedication && form.notifyBefore ? Number(form.notifyBefore) : null,
        endDate:       isMedication && form.endDate ? form.endDate : null,
        notes:         form.notes || null,
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

  // Notification info text
  function notifyInfoText() {
    if (!isMedication || !form.frequency || form.frequency === "As Needed") {
      return "📧 You'll get an email reminder the day before and on the due date.";
    }
    const mins  = form.notifyBefore || globalNotify;
    const label = mins === "15" ? "15 minutes" : mins === "30" ? "30 minutes" : mins === "120" ? "2 hours" : "1 hour";
    const repeat = isCustomFreq
      ? `every ${form.customInterval} ${form.customUnit}`
      : form.frequency === "Weekly" ? "every week for 2 weeks"
      : form.frequency === "Monthly" ? "every month for 3 months"
      : "every day for 30 days";
    return `📧 You'll get an email ${label} before each dose. The calendar will show this medication repeating ${repeat} from the due date.`;
  }

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

        <div className="max-h-[75vh] overflow-y-auto">
          <div className="space-y-4 p-5">

            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {TYPES.map((t) => {
                  const c = TYPE_CONFIG[t];
                  return (
                    <button key={t} type="button" onClick={() => { set("type", t); set("frequency", ""); set("reminderTimes", []); }}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center ring-1 transition-all text-xs font-medium ${
                        form.type === t ? `${c.color} ring-2` : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ring-gray-200 dark:ring-gray-700 hover:bg-gray-100"
                      }`}>
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
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder={
                  form.type === "VET_APPOINTMENT" ? "e.g. Annual checkup" :
                  form.type === "MEDICATION"      ? "e.g. Give Rimadyl" :
                  form.type === "GROOMING"        ? "e.g. Bath & nail trim" :
                  form.type === "VACCINATION"     ? "e.g. Rabies booster" : "Reminder title"
                }
                autoFocus
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
              />
            </div>

            {/* Pet selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pet <span className="text-red-500">*</span>
              </label>
              <select value={form.petId} onChange={(e) => set("petId", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900">
                {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isMedication ? "Start date" : "Due date"} <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
              />
            </div>

            {/* ── MEDICATION-ONLY FIELDS ── */}
            {isMedication && (
              <>
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={(e) => handleFrequencyChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900">
                    <option value="">Select frequency…</option>
                    {FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custom frequency interval */}
                {isCustomFreq && (
                  <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3.5 space-y-3 ring-1 ring-purple-100 dark:ring-purple-800">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Custom interval</p>
                    <div className="flex gap-2">
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Every</label>
                        <input type="number" min="1" max="99" value={form.customInterval}
                          onChange={(e) => set("customInterval", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Unit</label>
                        <select value={form.customUnit} onChange={(e) => set("customUnit", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400">
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic time pickers */}
                {timeCount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dose time{timeCount > 1 ? "s" : ""}
                    </label>
                    <div className={`grid gap-2 ${timeCount >= 3 ? "grid-cols-3" : timeCount === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {Array.from({ length: timeCount }).map((_, i) => (
                        <div key={i}>
                          <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">
                            {timeCount === 1 ? "Time" : `Dose ${i + 1}`}
                            {form.reminderTimes[i] ? ` — ${timeLabel(form.reminderTimes[i])}` : ""}
                          </label>
                          <input type="time" value={form.reminderTimes[i] ?? ""}
                            onChange={(e) => setTime(i, e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notify before */}
                {form.frequency && form.frequency !== "As Needed" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Send email reminder
                    </label>
                    <select value={form.notifyBefore || globalNotify}
                      onChange={(e) => set("notifyBefore", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100">
                      <option value="15">15 minutes before each dose</option>
                      <option value="30">30 minutes before each dose</option>
                      <option value="60">1 hour before each dose</option>
                      <option value="120">2 hours before each dose</option>
                    </select>
                  </div>
                )}

                {/* End date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End date <span className="text-gray-400 dark:text-gray-500 text-xs">(optional — when medication course ends)</span>
                  </label>
                  <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                rows={2} placeholder="Any extra details…"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900 resize-none"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">{error}</p>
            )}
          </div>
        </div>

        {/* Email notification info */}
        <div className="px-5 pb-3">
          <p className="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3.5 py-2.5 text-xs text-blue-700 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-800">
            {notifyInfoText()}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
          <button onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50">
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
