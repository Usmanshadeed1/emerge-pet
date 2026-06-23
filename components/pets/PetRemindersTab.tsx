"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AddReminderModal from "@/components/reminders/AddReminderModal";

type ReminderType = "VET_APPOINTMENT" | "MEDICATION" | "GROOMING" | "VACCINATION" | "CUSTOM";

interface Pet { id: string; name: string; species: string }

interface Reminder {
  id:            string;
  petId:         string;
  title:         string;
  type:          ReminderType;
  dueDate:       string;
  dueTime:       string | null;
  frequency:     string | null;
  reminderTimes: string[];
  notes:         string | null;
  isCompleted:   boolean;
}

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const TYPE_CONFIG: Record<ReminderType, { label: string; emoji: string; pill: string }> = {
  VET_APPOINTMENT: { label: "Vet Appointment", emoji: "🏥", pill: "bg-blue-50 dark:bg-blue-900/30   text-blue-700 dark:text-blue-300   ring-blue-100 dark:ring-blue-800" },
  MEDICATION:      { label: "Medication",       emoji: "💊", pill: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-purple-100 dark:ring-purple-800" },
  GROOMING:        { label: "Grooming",         emoji: "✂️", pill: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-orange-100 dark:ring-orange-800" },
  VACCINATION:     { label: "Vaccination",      emoji: "💉", pill: "bg-teal-50 dark:bg-teal-900/30   text-teal-700 dark:text-teal-300   ring-teal-100 dark:ring-teal-800" },
  CUSTOM:          { label: "Custom",           emoji: "📌", pill: "bg-gray-50 dark:bg-gray-800     text-gray-700 dark:text-gray-300   ring-gray-200 dark:ring-gray-700" },
};

function isOverdue(r: Reminder) {
  return !r.isCompleted && new Date(r.dueDate) < new Date(new Date().toDateString());
}

export default function PetRemindersTab({ petId, petName }: { petId: string; petName: string }) {
  const [reminders,  setReminders]  = useState<Reminder[]>([]);
  const [pets,       setPets]       = useState<Pet[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState<Reminder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [remRes, petRes] = await Promise.all([
        fetch(`/api/pets/${petId}/reminders`),
        fetch("/api/pets"),
      ]);
      setReminders(await remRes.json() as Reminder[]);
      const petData = await petRes.json() as Pet[];
      setPets(Array.isArray(petData) ? petData : []);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(r: Reminder) {
    const res = await fetch(`/api/pets/${petId}/reminders/${r.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isCompleted: !r.isCompleted }),
    });
    if (res.ok) setReminders((prev) => prev.map((x) => x.id === r.id ? { ...x, isCompleted: !r.isCompleted } : x));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pets/${petId}/reminders/${id}`, { method: "DELETE" });
    if (res.ok) setReminders((prev) => prev.filter((x) => x.id !== id));
  }

  const sorted = [...reminders].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const active  = sorted.filter((r) => !r.isCompleted);
  const done    = sorted.filter((r) => r.isCompleted);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Reminder
        </button>
        <Link
          href={`/dashboard/calendar?petId=${petId}&petName=${encodeURIComponent(petName)}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800 transition-all"
        >
          View calendar →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="animate-pulse h-16 rounded-xl bg-gray-100 dark:bg-gray-700" />)}
        </div>
      ) : active.length === 0 && done.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-14 text-center">
          <span className="mb-3 text-4xl">🔔</span>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No reminders for {petName}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Add vet visits, medications, and grooming reminders.</p>
          <button onClick={() => setShowModal(true)} className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            + Add first reminder
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((r) => {
            const cfg     = TYPE_CONFIG[r.type];
            const overdue = isOverdue(r);
            return (
              <div key={r.id} className={`group flex items-start gap-3 rounded-xl p-3.5 ring-1 ${overdue ? "bg-red-50 dark:bg-red-900/20 ring-red-100 dark:ring-red-900" : "bg-white dark:bg-gray-900 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300"}`}>
                <button onClick={() => handleToggle(r)}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${overdue ? "border-red-400 hover:bg-red-100" : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-700"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-md px-1.5 py-0.5 font-medium ring-1 ${cfg.pill}`}>{cfg.emoji} {cfg.label}</span>
                    <span className="text-gray-400 dark:text-gray-500">{new Date(r.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {r.dueTime && <span className="text-gray-400 dark:text-gray-500">⏰ {r.dueTime}</span>}
                    {r.frequency && <span className="text-gray-400 dark:text-gray-500">🔄 {r.frequency}</span>}
                    {r.reminderTimes && r.reminderTimes.length > 0 && (
                      <span className="text-gray-400 dark:text-gray-500">🕐 {r.reminderTimes.map(fmt12).join(" · ")}</span>
                    )}
                    {overdue && <span className="rounded-md bg-red-100 px-1.5 py-0.5 font-semibold text-red-600">Overdue</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditItem(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:bg-red-900/20 hover:text-red-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            );
          })}

          {done.length > 0 && (
            <details className="rounded-xl bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-800">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 select-none">
                Completed ({done.length})
              </summary>
              <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4 pb-2">
                {done.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 opacity-60">
                    <button onClick={() => handleToggle(r)}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white border-2 border-green-500">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-through">{r.title}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {showModal && (
        <AddReminderModal
          pets={pets}
          onClose={() => setShowModal(false)}
          onSaved={load}
          defaultPetId={petId}
        />
      )}

      {editItem && (
        <AddReminderModal
          pets={pets}
          onClose={() => setEditItem(null)}
          onSaved={load}
          initial={{
            id:        editItem.id,
            title:     editItem.title,
            type:      editItem.type,
            petId:     editItem.petId,
            dueDate:   editItem.dueDate.slice(0, 10),
            dueTime:   editItem.dueTime   ?? "",
            frequency: editItem.frequency ?? "",
            notes:     editItem.notes     ?? "",
          }}
        />
      )}
    </div>
  );
}
