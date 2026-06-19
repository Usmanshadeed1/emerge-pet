"use client";

import { useState } from "react";

interface RequestClinicModalProps {
  petId:   string;
  petName: string;
  onClose: () => void;
  onSent:  (uploadUrl: string) => void;
}

export default function RequestClinicModal({ petId, petName, onClose, onSent }: RequestClinicModalProps) {
  const [clinicName,  setClinicName]  = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleSend() {
    if (!clinicName.trim() || !clinicEmail.trim()) {
      setError("Clinic name and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clinicEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError("");

    const res  = await fetch("/api/record-requests", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petId, clinicName: clinicName.trim(), clinicEmail: clinicEmail.trim() }),
    });

    if (res.ok) {
      const data = await res.json() as { uploadUrl: string };
      onSent(data.uploadUrl);
      onClose();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to send request.");
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 anim-scale-in">
        {/* Icon */}
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 ring-1 ring-green-100 dark:ring-green-900 text-xl">📩</div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request records from clinic</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We&apos;ll email the clinic a secure one-time upload link for <strong>{petName}</strong>&apos;s records.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clinic name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => { setClinicName(e.target.value); setError(""); }}
              placeholder="City Animal Hospital"
              autoFocus
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clinic email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={clinicEmail}
              onChange={(e) => { setClinicEmail(e.target.value); setError(""); }}
              placeholder="records@clinic.com"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">{error}</p>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {sending && (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            )}
            {sending ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
