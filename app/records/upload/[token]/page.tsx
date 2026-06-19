"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type PageState = "loading" | "valid" | "uploaded" | "invalid";

export default function ClinicUploadPage() {
  const params = useParams<{ token: string }>();
  const token  = params.token;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [petName,   setPetName]   = useState("");
  const [clinicName, setClinicName] = useState("");
  const [file,      setFile]      = useState<File | null>(null);
  const [notes,     setNotes]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const res  = await fetch(`/api/record-requests/${token}/check`);
        const data = await res.json() as {
          valid?: boolean;
          uploaded?: boolean;
          petName?: string;
          clinicName?: string;
        };
        if (!res.ok || !data.valid) {
          setPageState("invalid");
        } else if (data.uploaded) {
          setPageState("uploaded");
        } else {
          setPetName(data.petName   ?? "");
          setClinicName(data.clinicName ?? "");
          setPageState("valid");
        }
      } catch {
        setPageState("invalid");
      }
    }
    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file",  file);
    formData.append("notes", notes);

    const res = await fetch(`/api/record-requests/${token}/upload`, {
      method: "POST",
      body:   formData,
    });

    if (res.ok) {
      setSuccess(true);
      setPageState("uploaded");
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Upload failed. Please try again.");
    }
    setUploading(false);
  }

  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-3xl">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Link</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This upload link is invalid or has expired. Please contact the pet owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "uploaded") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 text-center shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 text-3xl">✅</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {success ? "Records Uploaded!" : "Already Uploaded"}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {success
              ? `Thank you! The records for ${petName} have been securely uploaded and the owner has been notified.`
              : "Records for this pet have already been uploaded via this link."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <span className="text-xl">🐾</span>
            <span className="font-semibold text-gray-600 dark:text-gray-400">EmergePet</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 shadow-md text-2xl">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EmergePet</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Secure veterinary records upload.</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
          {/* Info banner */}
          <div className="mb-5 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 ring-1 ring-green-100 dark:ring-green-900">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Records request for <strong>{petName}</strong>
            </p>
            {clinicName && (
              <p className="mt-0.5 text-xs text-green-600">From: {clinicName}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Medical records file
                <span className="ml-1 text-red-500">*</span>
              </label>
              <div
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer ${
                  file
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20"
                }`}
                onClick={() => document.getElementById("clinic-file-input")?.click()}
              >
                <input
                  id="clinic-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setError("");
                  }}
                />
                {file ? (
                  <>
                    <svg className="mb-2 h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{file.name}</p>
                    <p className="text-xs text-green-500 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                    </p>
                  </>
                ) : (
                  <>
                    <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click or drag to select file</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">PDF, JPEG, PNG — max 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="clinic-notes">
                Additional notes <span className="text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <textarea
                id="clinic-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any context about these records..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:ring-green-900 resize-none"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {uploading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              )}
              {uploading ? "Uploading…" : "Upload records"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            Secured by EmergePet · Records are encrypted and shared only with the pet owner
          </p>
        </div>
      </div>
    </div>
  );
}
