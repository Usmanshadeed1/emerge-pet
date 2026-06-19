"use client";

import { useState, useEffect, useCallback } from "react";

interface EmrKey {
  id:         string;
  clinicName: string;
  keyHash:    string;
  isActive:   boolean;
  lastUsedAt: string | null;
  createdAt:  string;
  revokedAt:  string | null;
}

function maskHash(hash: string) {
  return hash.slice(0, 8) + "••••••••••••••••" + hash.slice(-4);
}

export default function AdminEmrPage() {
  const [keys,       setKeys]       = useState<EmrKey[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newKey,     setNewKey]     = useState<{ rawKey: string; clinicName: string } | null>(null);
  const [revoking,   setRevoking]   = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/emr");
    const data = await res.json() as EmrKey[];
    setKeys(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    if (!clinicName.trim()) return;
    setGenerating(true);
    const res  = await fetch("/api/admin/emr", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ clinicName }),
    });
    const data = await res.json() as EmrKey & { rawKey: string };
    if (res.ok) {
      setNewKey({ rawKey: data.rawKey, clinicName: data.clinicName });
      setShowModal(false);
      setClinicName("");
      load();
    }
    setGenerating(false);
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    await fetch(`/api/admin/emr/${id}`, { method: "PATCH" });
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: false, revokedAt: new Date().toISOString() } : k));
    setRevoking(null);
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EMR Keys</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage API keys for clinic EMR integrations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Generate New Key
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-40 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-700 animate-pulse ml-4" />
              </div>
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700 text-2xl">🔑</div>
            <p className="font-medium text-gray-700 dark:text-gray-300">No EMR keys yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Generate a key to give a clinic secure access.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-4 bg-gray-50 dark:bg-gray-800 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <span>Clinic</span>
              <span>Key (masked)</span>
              <span>Created</span>
              <span>Status</span>
              <span></span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {keys.map((key) => (
                <div key={key.id} className="grid grid-cols-[1fr_2fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{key.clinicName}</p>
                  <code className="rounded-md bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 font-mono ring-1 ring-gray-200 dark:ring-gray-700 truncate">
                    {maskHash(key.keyHash)}
                  </code>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(key.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                    key.isActive
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-800"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${key.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    {key.isActive ? "Active" : "Revoked"}
                  </span>
                  {key.isActive && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      disabled={revoking === key.id}
                      className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {revoking === key.id ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                  {!key.isActive && <span />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Generate modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generate EMR Key</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the clinic name to generate a secure API key.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Clinic name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Riverside Animal Hospital"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!clinicName.trim() || generating}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                  {generating ? "Generating…" : "Generate Key"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw key display modal (shown once) */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-2xl ring-1 ring-green-100 dark:ring-green-900">🔑</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Key Generated for {newKey.clinicName}</h2>
            <p className="mt-1 text-sm text-red-600 font-medium">
              ⚠ Copy this key now — it will never be shown again.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-900 p-4">
              <code className="flex-1 text-xs text-green-400 font-mono break-all">
                {newKey.rawKey}
              </code>
              <button
                onClick={copyKey}
                className="flex-shrink-0 rounded-lg bg-white dark:bg-gray-900/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white dark:bg-gray-900/20 transition-all"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="mt-5 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all"
            >
              I&apos;ve saved the key — close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
