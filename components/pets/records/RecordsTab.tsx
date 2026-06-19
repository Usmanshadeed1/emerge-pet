"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AddRecordModal      from "./AddRecordModal";
import PdfReviewModal, { type ExtractedRecord } from "./PdfReviewModal";
import RequestClinicModal  from "./RequestClinicModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordType   = "VACCINATION" | "MEDICATION" | "VET_VISIT" | "LAB_RESULT" | "SURGERY" | "OTHER";
type RecordSource = "MANUAL" | "AI_EXTRACTED" | "VET_PUSHED" | "CLINIC_UPLOADED";
type VaccineStatus = "UP_TO_DATE" | "DUE_SOON" | "OVERDUE" | "NO_DUE_DATE";

interface HealthRecord {
  id:                string;
  petId:             string;
  type:              RecordType;
  title:             string;
  date:              string | null;
  nextDueDate:       string | null;
  vetName:           string | null;
  clinicName:        string | null;
  dosage:            string | null;
  notes:             string | null;
  source:            RecordSource;
  normalizedDrugName: string | null;
  brandDrugName:     string | null;
  hasFile:           boolean;
  createdAt:         string;
}

interface Vaccine {
  id:              string;
  name:            string;
  administeredDate: string | null;
  nextDueDate:     string | null;
  vetName:         string | null;
  clinicName:      string | null;
  status:          VaccineStatus;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<RecordType, { label: string; emoji: string; bg: string; text: string; ring: string }> = {
  VACCINATION: { label: "Vaccinations", emoji: "💉", bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-blue-700",   ring: "ring-blue-100" },
  MEDICATION:  { label: "Medications",  emoji: "💊", bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700", ring: "ring-purple-100" },
  VET_VISIT:   { label: "Vet Visits",   emoji: "🏥", bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-400",  ring: "ring-green-100 dark:ring-green-900" },
  LAB_RESULT:  { label: "Lab Results",  emoji: "🔬", bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700", ring: "ring-yellow-100" },
  SURGERY:     { label: "Surgeries",    emoji: "🩺", bg: "bg-red-50 dark:bg-red-900/20",    text: "text-red-700 dark:text-red-400",    ring: "ring-red-100 dark:ring-red-900" },
  OTHER:       { label: "Other",        emoji: "📋", bg: "bg-gray-50 dark:bg-gray-800",   text: "text-gray-600 dark:text-gray-400",   ring: "ring-gray-200 dark:ring-gray-700" },
};

const SOURCE_BADGE: Record<RecordSource, { label: string; cls: string }> = {
  MANUAL:           { label: "Manual",          cls: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" },
  AI_EXTRACTED:     { label: "AI extracted",    cls: "bg-violet-50 text-violet-600 ring-1 ring-violet-100" },
  VET_PUSHED:       { label: "From vet",        cls: "bg-blue-50 dark:bg-blue-900/20   text-blue-600  ring-1 ring-blue-100" },
  CLINIC_UPLOADED:  { label: "Clinic upload",   cls: "bg-teal-50   text-teal-600  ring-1 ring-teal-100" },
};

const CORE_VACCINES: Record<string, string[]> = {
  DOG: ["Rabies", "DHPP", "Bordetella", "Lyme"],
  CAT: ["Rabies", "FVRCP"],
};

const VACCINE_STATUS_CFG: Record<VaccineStatus | "NOT_RECORDED", { label: string; dot: string; pill: string }> = {
  UP_TO_DATE:   { label: "Up to date", dot: "bg-green-400",  pill: "bg-green-50 dark:bg-green-900/20  text-green-700 dark:text-green-400  ring-green-200 dark:ring-green-800" },
  DUE_SOON:     { label: "Due soon",   dot: "bg-amber-400",  pill: "bg-amber-50 dark:bg-amber-900/20  text-amber-700 dark:text-amber-400  ring-amber-200 dark:ring-amber-800" },
  OVERDUE:      { label: "Overdue",    dot: "bg-red-400",    pill: "bg-red-50 dark:bg-red-900/20    text-red-700 dark:text-red-400    ring-red-200 dark:ring-red-800" },
  NO_DUE_DATE:  { label: "No due date",dot: "bg-gray-300",   pill: "bg-gray-50 dark:bg-gray-800   text-gray-600 dark:text-gray-400   ring-gray-200 dark:ring-gray-700" },
  NOT_RECORDED: { label: "Not recorded",dot:"bg-gray-200 dark:bg-gray-700",   pill: "bg-gray-50 dark:bg-gray-800   text-gray-400 dark:text-gray-500   ring-gray-200 dark:ring-gray-700" },
};

const RECORD_TYPE_ORDER: RecordType[] = [
  "VACCINATION", "MEDICATION", "VET_VISIT", "LAB_RESULT", "SURGERY", "OTHER",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function computeVaccineStatus(nextDueDate: string | null): VaccineStatus {
  if (!nextDueDate) return "NO_DUE_DATE";
  const days = Math.floor((new Date(nextDueDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0)   return "OVERDUE";
  if (days <= 30) return "DUE_SOON";
  return "UP_TO_DATE";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VaccineTracker({ species, vaccines }: { species: string; vaccines: Vaccine[] }) {
  const coreList = CORE_VACCINES[species.toUpperCase()];
  if (!coreList) return null;

  const vaccineMap = new Map(vaccines.map((v) => [v.name.toLowerCase(), v]));

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 text-base">💉</div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Core Vaccine Tracker</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {species === "DOG" ? "Required for dogs" : "Required for cats"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {coreList.map((name) => {
          const vaccine = vaccineMap.get(name.toLowerCase());
          const status  = vaccine ? computeVaccineStatus(vaccine.nextDueDate) : "NOT_RECORDED";
          const cfg     = VACCINE_STATUS_CFG[status];

          return (
            <div
              key={name}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ring-1 ${cfg.pill}`}
              title={vaccine?.nextDueDate ? `Due: ${formatDate(vaccine.nextDueDate)}` : ""}
            >
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span>{name}</span>
              <span className="text-xs opacity-60">— {cfg.label}</span>
            </div>
          );
        })}
      </div>

      {vaccines.some((v) => computeVaccineStatus(v.nextDueDate) === "DUE_SOON") && (
        <p className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900">
          ⚠ Some vaccinations are due soon — consider scheduling a vet visit.
        </p>
      )}
      {vaccines.some((v) => computeVaccineStatus(v.nextDueDate) === "OVERDUE") && (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
          🚨 One or more vaccinations are overdue — please schedule a vet visit.
        </p>
      )}
    </div>
  );
}

function RecordCard({
  record,
  onEdit,
  onDelete,
}: {
  record:   HealthRecord;
  onEdit:   (r: HealthRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const src = SOURCE_BADGE[record.source];

  async function handleDelete() {
    setDeleting(true);
    await onDelete(record.id);
    setDeleting(false);
    setConfirmDelete(false);
  }

  return (
    <div className="group flex items-start gap-4 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3.5 ring-1 ring-gray-100 dark:ring-gray-800 hover:ring-gray-200 dark:ring-gray-700 transition-all">
      {/* Date column */}
      <div className="w-20 flex-shrink-0 text-right">
        {record.date ? (
          <>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(record.date).getFullYear()}
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-300">No date</p>
        )}
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">
              {record.title}
            </p>
            {record.normalizedDrugName && record.normalizedDrugName !== record.title && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Generic: {record.normalizedDrugName}
              </p>
            )}
          </div>
          {/* Source badge */}
          <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${src.cls}`}>
            {src.label}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {record.vetName    && <span>🩺 {record.vetName}</span>}
          {record.clinicName && <span>🏥 {record.clinicName}</span>}
          {record.dosage     && <span>💊 {record.dosage}</span>}
          {record.nextDueDate && (
            <span className={
              computeVaccineStatus(record.nextDueDate) === "OVERDUE"  ? "font-medium text-red-600" :
              computeVaccineStatus(record.nextDueDate) === "DUE_SOON" ? "font-medium text-amber-600" :
              ""
            }>
              Next: {formatDate(record.nextDueDate)}
            </span>
          )}
        </div>

        {record.notes && (
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{record.notes}</p>
        )}

        {record.hasFile && (
          <a
            href={`/api/records/${record.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
            </svg>
            View file
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!confirmDelete ? (
          <>
            <button
              onClick={() => onEdit(record)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-white dark:bg-gray-900 hover:text-gray-600 dark:text-gray-400 hover:shadow-sm transition-all"
              title="Edit"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:bg-red-900/20 hover:text-red-500 transition-all"
              title="Delete"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RecordGroup({
  type,
  records,
  onEdit,
  onDelete,
}: {
  type:     RecordType;
  records:  HealthRecord[];
  onEdit:   (r: HealthRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const cfg = TYPE_CONFIG[type];

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50 dark:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{cfg.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
            {records.length}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {records.map((r) => (
            <div key={r.id} className="px-5 py-1.5 first:pt-3 last:pb-3">
              <RecordCard record={r} onEdit={onEdit} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RecordsTabProps {
  petId:   string;
  species: string;
  petName: string;
}

export default function RecordsTab({ petId, species, petName }: RecordsTabProps) {
  const [records,  setRecords]  = useState<HealthRecord[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Modal states
  const [showAdd,     setShowAdd]     = useState(false);
  const [editRecord,  setEditRecord]  = useState<HealthRecord | null>(null);
  const [showReview,  setShowReview]  = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [extracted,   setExtracted]   = useState<ExtractedRecord[]>([]);
  const [extractedFile, setExtractedFile] = useState<{
    base64: string | null; mimeType: string | null; fileName: string | null;
  }>({ base64: null, mimeType: null, fileName: null });

  // PDF upload state
  const [extracting, setExtracting]  = useState(false);
  const [extractErr, setExtractErr]  = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Toast for clinic request
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/pets/${petId}/records`);
      if (!res.ok) throw new Error("Failed to load records.");
      const data = await res.json() as { records: HealthRecord[]; vaccines: Vaccine[] };
      setRecords(data.records);
      setVaccines(data.vaccines);
    } catch {
      setError("Failed to load health records.");
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pets/${petId}/records/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  }

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setExtracting(true);
    setExtractErr("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/pets/${petId}/records/pdf`, {
      method: "POST",
      body:   formData,
    });

    const data = await res.json() as {
      records?:      ExtractedRecord[];
      fileBase64?:   string | null;
      fileMimeType?: string | null;
      fileName?:     string | null;
      error?:        string;
    };

    if (!res.ok) {
      setExtractErr(data.error ?? "Extraction failed.");
    } else {
      setExtracted(data.records ?? []);
      setExtractedFile({
        base64:   data.fileBase64   ?? null,
        mimeType: data.fileMimeType ?? null,
        fileName: data.fileName     ?? null,
      });
      setShowReview(true);
    }
    setExtracting(false);
  }

  // Group records by type
  const grouped = RECORD_TYPE_ORDER.reduce<Record<RecordType, HealthRecord[]>>(
    (acc, type) => {
      acc[type] = records.filter((r) => r.type === type);
      return acc;
    },
    {} as Record<RecordType, HealthRecord[]>
  );

  const totalRecords = records.length;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Vaccine Tracker */}
      <VaccineTracker species={species} vaccines={vaccines} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Record
        </button>

        <button
          onClick={() => pdfInputRef.current?.click()}
          disabled={extracting}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all disabled:opacity-50"
        >
          {extracting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Extracting…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
              Upload PDF
            </>
          )}
        </button>
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handlePdfChange}
        />

        <button
          onClick={() => setShowRequest(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
          </svg>
          Request from Clinic
        </button>

        {totalRecords > 0 && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {totalRecords} record{totalRecords !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {extractErr && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900">
          <strong>Extraction issue:</strong> {extractErr}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white dark:bg-gray-900 p-5 ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-2 pl-8">
                <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-700" />
                <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
          {error}
          <button onClick={load} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalRecords === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20 ring-1 ring-green-100 dark:ring-green-900 text-3xl">🏥</div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">No health records yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-400 dark:text-gray-500">
            Add {petName}&apos;s first health record, upload a PDF, or request records from their clinic.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              + Add first record
            </button>
          </div>
        </div>
      )}

      {/* Grouped records */}
      {!loading && !error && totalRecords > 0 && (
        <div className="space-y-4">
          {RECORD_TYPE_ORDER.filter((t) => grouped[t].length > 0).map((type) => (
            <RecordGroup
              key={type}
              type={type}
              records={grouped[type]}
              onEdit={setEditRecord}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddRecordModal
          petId={petId}
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}

      {editRecord && (
        <AddRecordModal
          petId={petId}
          onClose={() => setEditRecord(null)}
          onSaved={load}
          initial={{
            id:          editRecord.id,
            type:        editRecord.type,
            title:       editRecord.title,
            date:        editRecord.date?.slice(0, 10) ?? "",
            nextDueDate: editRecord.nextDueDate?.slice(0, 10) ?? "",
            vetName:     editRecord.vetName     ?? "",
            clinicName:  editRecord.clinicName  ?? "",
            dosage:      editRecord.dosage      ?? "",
            notes:       editRecord.notes       ?? "",
          }}
        />
      )}

      {showReview && (
        <PdfReviewModal
          petId={petId}
          records={extracted}
          fileBase64={extractedFile.base64}
          fileMimeType={extractedFile.mimeType}
          fileName={extractedFile.fileName}
          onClose={() => setShowReview(false)}
          onImported={load}
        />
      )}

      {showRequest && (
        <RequestClinicModal
          petId={petId}
          petName={petName}
          onClose={() => setShowRequest(false)}
          onSent={(url) => {
            setToast(`Request sent! Upload link: ${url}`);
            setTimeout(() => setToast(""), 5000);
          }}
        />
      )}
    </div>
  );
}
