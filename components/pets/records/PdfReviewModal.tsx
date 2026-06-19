"use client";

import { useState } from "react";

type RecordType = "VACCINATION" | "MEDICATION" | "VET_VISIT" | "LAB_RESULT" | "SURGERY" | "OTHER";

export interface ExtractedRecord {
  type:        RecordType;
  title:       string;
  date:        string | null;
  nextDueDate: string | null;
  vetName:     string | null;
  clinicName:  string | null;
  dosage:      string | null;
  notes:       string | null;
}

interface PdfReviewModalProps {
  petId:        string;
  records:      ExtractedRecord[];
  fileBase64:   string | null;
  fileMimeType: string | null;
  fileName:     string | null;
  onClose:      () => void;
  onImported:   () => void;
}

const TYPE_LABELS: Record<RecordType, { label: string; emoji: string; color: string }> = {
  VACCINATION: { label: "Vaccination", emoji: "💉", color: "bg-blue-50 dark:bg-blue-900/20   text-blue-700   ring-blue-100" },
  MEDICATION:  { label: "Medication",  emoji: "💊", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 ring-purple-100" },
  VET_VISIT:   { label: "Vet Visit",   emoji: "🏥", color: "bg-green-50 dark:bg-green-900/20  text-green-700 dark:text-green-400  ring-green-100 dark:ring-green-900" },
  LAB_RESULT:  { label: "Lab Result",  emoji: "🔬", color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 ring-yellow-100" },
  SURGERY:     { label: "Surgery",     emoji: "🩺", color: "bg-red-50 dark:bg-red-900/20    text-red-700 dark:text-red-400    ring-red-100 dark:ring-red-900" },
  OTHER:       { label: "Other",       emoji: "📋", color: "bg-gray-50 dark:bg-gray-800   text-gray-700 dark:text-gray-300   ring-gray-200 dark:ring-gray-700" },
};

const RECORD_TYPES = Object.keys(TYPE_LABELS) as RecordType[];

export default function PdfReviewModal({
  petId, records, fileBase64, fileMimeType, fileName, onClose, onImported,
}: PdfReviewModalProps) {
  const [selected,  setSelected]  = useState<boolean[]>(() => records.map(() => true));
  const [editable,  setEditable]  = useState<ExtractedRecord[]>(() =>
    records.map((r) => ({ ...r }))
  );
  const [importing, setImporting] = useState(false);
  const [error,     setError]     = useState("");

  function toggleAll(checked: boolean) {
    setSelected(records.map(() => checked));
  }

  function toggleOne(i: number) {
    setSelected((s) => s.map((v, idx) => (idx === i ? !v : v)));
  }

  function updateRecord(i: number, field: keyof ExtractedRecord, value: string) {
    setEditable((arr) => arr.map((r, idx) => idx === i ? { ...r, [field]: value || null } : r));
  }

  async function handleImport() {
    const toImport = editable.filter((_, i) => selected[i]);
    if (toImport.length === 0) {
      setError("Select at least one record to import.");
      return;
    }

    setImporting(true);
    setError("");

    try {
      await Promise.all(
        toImport.map((rec) =>
          fetch(`/api/pets/${petId}/records`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...rec, source: "AI_EXTRACTED", fileBase64, fileMimeType, fileName }),
          })
        )
      );
      onImported();
      onClose();
    } catch {
      setError("Failed to import records. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = selected.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full sm:max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 max-h-[90vh] anim-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Review Extracted Records</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {records.length} record{records.length !== 1 ? "s" : ""} found — select which to import
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAll(selectedCount < records.length)}
              className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400"
            >
              {selectedCount < records.length ? "Select all" : "Deselect all"}
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Records list */}
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <span className="text-3xl">🤷</span>
            <p className="font-medium text-gray-700 dark:text-gray-300">No records found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Claude couldn&apos;t extract any health records from this file.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {editable.map((rec, i) => {
              const cfg = TYPE_LABELS[rec.type];
              const isSelected = selected[i];

              // Date warning: flag future dates that might be data entry errors
              const dateWarn = rec.date && new Date(rec.date) > new Date();

              return (
                <div
                  key={i}
                  className={`p-4 transition-colors ${isSelected ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800 opacity-60"}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleOne(i)}
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Type + Title row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={rec.type}
                          onChange={(e) => updateRecord(i, "type", e.target.value)}
                          className={`rounded-lg px-2 py-0.5 text-xs font-medium ring-1 outline-none ${cfg.color}`}
                        >
                          {RECORD_TYPES.map((t) => (
                            <option key={t} value={t}>{TYPE_LABELS[t].emoji} {TYPE_LABELS[t].label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={rec.title}
                          onChange={(e) => updateRecord(i, "title", e.target.value)}
                          className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                        />
                      </div>

                      {/* Date row */}
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Date</label>
                          <input
                            type="date"
                            value={rec.date ?? ""}
                            onChange={(e) => updateRecord(i, "date", e.target.value)}
                            className={`rounded-lg border px-2 py-1 text-xs outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900 ${
                              dateWarn ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            }`}
                          />
                          {dateWarn && (
                            <span className="text-xs text-amber-600">⚠ future date</span>
                          )}
                        </div>
                        {rec.type === "VACCINATION" && (
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">Due date</label>
                            <input
                              type="date"
                              value={rec.nextDueDate ?? ""}
                              onChange={(e) => updateRecord(i, "nextDueDate", e.target.value)}
                              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
                            />
                          </div>
                        )}
                      </div>

                      {/* Vet + Clinic */}
                      {(rec.vetName || rec.clinicName) && (
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {rec.vetName    && <span>🩺 {rec.vetName}</span>}
                          {rec.clinicName && <span>🏥 {rec.clinicName}</span>}
                        </div>
                      )}

                      {/* Dosage / notes */}
                      {rec.dosage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{rec.dosage}</p>
                      )}
                      {rec.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{rec.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 flex-shrink-0">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {importing && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              )}
              {importing
                ? "Importing…"
                : `Import ${selectedCount} record${selectedCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
