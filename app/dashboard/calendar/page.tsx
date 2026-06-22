"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AddReminderModal from "@/components/reminders/AddReminderModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReminderType = "VET_APPOINTMENT" | "MEDICATION" | "GROOMING" | "VACCINATION" | "CUSTOM";

interface Pet { id: string; name: string; species: string }

interface Reminder {
  id:          string;
  petId:       string;
  title:       string;
  type:        ReminderType;
  dueDate:     string;
  dueTime:     string | null;
  frequency:   string | null;
  notes:       string | null;
  isCompleted: boolean;
  completedAt: string | null;
  pet:         Pet | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ReminderType, { label: string; emoji: string; dot: string; pill: string }> = {
  VET_APPOINTMENT: { label: "Vet Appointment", emoji: "🏥", dot: "bg-blue-400",   pill: "bg-blue-50 dark:bg-blue-900/20   text-blue-700   ring-blue-100" },
  MEDICATION:      { label: "Medication",       emoji: "💊", dot: "bg-purple-400", pill: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 ring-purple-100" },
  GROOMING:        { label: "Grooming",         emoji: "✂️", dot: "bg-orange-400", pill: "bg-orange-50 text-orange-700 ring-orange-100" },
  VACCINATION:     { label: "Vaccination",      emoji: "💉", dot: "bg-teal-400",   pill: "bg-teal-50   text-teal-700   ring-teal-100" },
  CUSTOM:          { label: "Custom",           emoji: "📌", dot: "bg-gray-400",   pill: "bg-gray-50 dark:bg-gray-800   text-gray-700 dark:text-gray-300   ring-gray-200 dark:ring-gray-700" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isOverdue(r: Reminder): boolean {
  if (r.isCompleted) return false;
  return new Date(r.dueDate) < new Date(new Date().toDateString());
}

function dotColor(reminders: Reminder[]): string {
  const hasOverdue = reminders.some(isOverdue);
  if (hasOverdue) return "bg-red-400";
  const hasVax = reminders.some((r) => r.type === "VACCINATION");
  if (hasVax) return "bg-teal-400";
  return "bg-purple-400";
}

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  onToggle: (r: Reminder) => void;
  onEdit:   (r: Reminder) => void;
  onDelete: (r: Reminder) => void;
}) {
  const cfg      = TYPE_CONFIG[reminder.type];
  const overdue  = isOverdue(reminder);

  return (
    <div className={`group flex items-start gap-3 rounded-xl p-3.5 ring-1 transition-all ${
      reminder.isCompleted
        ? "bg-gray-50 dark:bg-gray-800 ring-gray-100 dark:ring-gray-800 opacity-60"
        : overdue
          ? "bg-red-50 dark:bg-red-900/20 ring-red-100 dark:ring-red-900"
          : "bg-white dark:bg-gray-900 ring-gray-200 dark:ring-gray-700 hover:ring-gray-300"
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(reminder)}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          reminder.isCompleted
            ? "border-green-500 bg-green-500 text-white"
            : overdue
              ? "border-red-400 hover:bg-red-100"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-700"
        }`}
      >
        {reminder.isCompleted && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-tight ${reminder.isCompleted ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
            {reminder.title}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(reminder)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
              </svg>
            </button>
            <button
              onClick={() => onDelete(reminder)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 dark:text-gray-500 hover:bg-red-100 hover:text-red-500"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ${cfg.pill}`}>
            {cfg.emoji} {cfg.label}
          </span>
          {reminder.pet && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{reminder.pet.name}</span>
          )}
          {reminder.dueTime && (
            <span className="text-xs text-gray-400 dark:text-gray-500">⏰ {reminder.dueTime}</span>
          )}
          {reminder.frequency && (
            <span className="text-xs text-gray-400 dark:text-gray-500">🔄 {reminder.frequency}</span>
          )}
          {overdue && (
            <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600">Overdue</span>
          )}
        </div>

        {reminder.notes && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{reminder.notes}</p>
        )}
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function CalendarGrid({
  year, month, remindersByDate, selectedDate, onSelectDate,
}: {
  year:            number;
  month:           number;
  remindersByDate: Map<string, Reminder[]>;
  selectedDate:    string | null;
  onSelectDate:    (key: string) => void;
}) {
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey   = toDateKey(new Date());

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-semibold text-gray-400 dark:text-gray-500">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const key        = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayReminders = remindersByDate.get(key) ?? [];
          const isToday    = key === todayKey;
          const isSelected = key === selectedDate;
          const hasItems   = dayReminders.length > 0;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(key)}
              className={`relative flex flex-col items-center justify-start rounded-xl p-1.5 pt-2 transition-all min-h-[52px] ${
                isSelected
                  ? "bg-green-600 text-white shadow-sm"
                  : isToday
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800"
                    : "hover:bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="text-sm font-medium leading-none">{day}</span>
              {hasItems && (
                <div className="mt-1.5 flex gap-0.5 flex-wrap justify-center">
                  {dayReminders.slice(0, 3).map((r, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected
                          ? "bg-white dark:bg-gray-900/80"
                          : isOverdue(r)
                            ? "bg-red-400"
                            : r.type === "VACCINATION"
                              ? "bg-teal-400"
                              : dotColor([r])
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
        {[
          { dot: "bg-red-400",    label: "Overdue" },
          { dot: "bg-teal-400",   label: "Vaccination" },
          { dot: "bg-purple-400", label: "Other" },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const fromPetId   = searchParams.get("petId");
  const fromPetName = searchParams.get("petName");

  const today = new Date();

  const [reminders,    setReminders]    = useState<Reminder[]>([]);
  const [pets,         setPets]         = useState<Pet[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [calYear,      setCalYear]      = useState(today.getFullYear());
  const [calMonth,     setCalMonth]     = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateKey(today));
  const [showModal,    setShowModal]    = useState(false);
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [remRes, petRes] = await Promise.all([
        fetch("/api/reminders"),
        fetch("/api/pets"),
      ]);
      const remData = await remRes.json() as Reminder[];
      const petData = await petRes.json() as Pet[];
      setReminders(Array.isArray(remData) ? remData : []);
      setPets(Array.isArray(petData) ? petData : []);
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(r: Reminder) {
    const res = await fetch(`/api/pets/${r.petId}/reminders/${r.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isCompleted: !r.isCompleted }),
    });
    if (res.ok) {
      setReminders((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? { ...x, isCompleted: !r.isCompleted, completedAt: !r.isCompleted ? new Date().toISOString() : null }
            : x
        )
      );
    }
  }

  async function handleDelete(r: Reminder) {
    const res = await fetch(`/api/pets/${r.petId}/reminders/${r.id}`, { method: "DELETE" });
    if (res.ok) setReminders((prev) => prev.filter((x) => x.id !== r.id));
  }

  const remindersByDate = new Map<string, Reminder[]>();
  reminders.forEach((r) => {
    const key = toDateKey(new Date(r.dueDate));
    remindersByDate.set(key, [...(remindersByDate.get(key) ?? []), r]);
  });

  const selectedReminders = selectedDate ? (remindersByDate.get(selectedDate) ?? []) : [];
  const overdueReminders  = reminders.filter((r) => isOverdue(r));
  const upcomingReminders = reminders.filter((r) => !r.isCompleted && !isOverdue(r)).slice(0, 5);

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      })
    : "";

  return (
    <div className="space-y-6 anim-fade-in">
      {/* Back button — only shown when arriving from a pet page */}
      {fromPetId && (
        <Link
          href={`/dashboard/pets/${fromPetId}?tab=reminders`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
          Back to {fromPetName ?? "pet"}
        </Link>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {reminders.length} total · {overdueReminders.length} overdue
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Reminder
        </button>
      </div>

      {/* Overdue banner */}
      {overdueReminders.length > 0 && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 ring-1 ring-red-100 dark:ring-red-900">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            🚨 {overdueReminders.length} overdue reminder{overdueReminders.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            {overdueReminders.map((r) => r.title).slice(0, 3).join(", ")}
            {overdueReminders.length > 3 ? ` + ${overdueReminders.length - 3} more` : ""}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left — Calendar */}
        <div className="space-y-4">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-1">
            <button onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {MONTHS[calMonth]} {calYear}
            </h2>
            <button onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="animate-pulse grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700" />
                ))}
              </div>
            </div>
          ) : (
            <CalendarGrid
              year={calYear}
              month={calMonth}
              remindersByDate={remindersByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}

          {/* Selected day panel */}
          {selectedDate && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{selectedDateLabel}</h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  + Add
                </button>
              </div>
              {selectedReminders.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No reminders for this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedReminders.map((r) => (
                    <ReminderCard
                      key={r.id}
                      reminder={r}
                      onToggle={handleToggle}
                      onEdit={(rem) => { setEditReminder(rem); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4">
          {/* Upcoming */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Upcoming</h3>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="animate-pulse h-14 rounded-xl bg-gray-100 dark:bg-gray-700" />
                ))}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No upcoming reminders.</p>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onToggle={handleToggle}
                    onEdit={(rem) => { setEditReminder(rem); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* All overdue */}
          {overdueReminders.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">Overdue</h3>
              <div className="space-y-2">
                {overdueReminders.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onToggle={handleToggle}
                    onEdit={(rem) => { setEditReminder(rem); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && reminders.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-12 text-center">
              <span className="mb-3 text-4xl">🔔</span>
              <p className="font-semibold text-gray-700 dark:text-gray-300">No reminders yet</p>
              <p className="mt-1 max-w-xs text-sm text-gray-400 dark:text-gray-500">
                Add reminders for vet visits, medications, and grooming to stay on track.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                + Add first reminder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <AddReminderModal
          pets={pets}
          onClose={() => setShowModal(false)}
          onSaved={load}
          defaultPetId={pets[0]?.id}
        />
      )}

      {editReminder && (
        <AddReminderModal
          pets={pets}
          onClose={() => setEditReminder(null)}
          onSaved={load}
          initial={{
            id:        editReminder.id,
            title:     editReminder.title,
            type:      editReminder.type,
            petId:     editReminder.petId,
            dueDate:   editReminder.dueDate.slice(0, 10),
            dueTime:   editReminder.dueTime  ?? "",
            frequency: editReminder.frequency ?? "",
            notes:     editReminder.notes    ?? "",
          }}
        />
      )}
    </div>
  );
}
