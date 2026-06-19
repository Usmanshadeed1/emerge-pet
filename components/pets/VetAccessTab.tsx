"use client";

import { useState, useEffect, useCallback } from "react";

interface VetAccessRecord {
  id:         string;
  accessCode: string;
  vetName:    string | null;
  vetEmail:   string | null;
  isActive:   boolean;
  createdAt:  string;
  pet:        { id: string; name: string; species: string };
}

interface Props {
  petId:   string;
  petName: string;
}

export function VetAccessTab({ petId, petName }: Props) {
  const [records,     setRecords]     = useState<VetAccessRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [newCode,     setNewCode]     = useState<string | null>(null);
  const [vetName,     setVetName]     = useState("");
  const [vetEmail,    setVetEmail]    = useState("");
  const [revoking,    setRevoking]    = useState<string | null>(null);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/vet-access");
      const data = await res.json();
      // Filter to only records for this pet
      setRecords((data as VetAccessRecord[]).filter((r) => r.pet.id === petId));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setGenerating(true);
    try {
      const res  = await fetch("/api/vet-access", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ petId, vetName: vetName || null, vetEmail: vetEmail || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewCode(data.accessCode);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate code.");
    } finally {
      setGenerating(false);
    }
  }

  async function revoke(id: string) {
    setRevoking(id);
    try {
      await fetch(`/api/vet-access/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setRevoking(null);
      setConfirmId(null);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/vet-portal` : "/vet-portal";

  return (
    <div className="space-y-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Vet Access</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Share a code with your vet so they can view {petName}&apos;s records and submit visit notes.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setNewCode(null); setVetName(""); setVetEmail(""); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Vet Access
        </button>
      </div>

      {/* Access list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 text-2xl">🏥</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No vet access codes yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Generate a code to share with your vet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-gray-900 dark:text-white tracking-widest">{r.accessCode}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
                </div>
                {r.vetName && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.vetName}{r.vetEmail ? ` · ${r.vetEmail}` : ""}</p>}
                <p className="text-xs text-gray-400 dark:text-gray-500">Created {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              {confirmId === r.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Revoke?</span>
                  <button onClick={() => revoke(r.id)} disabled={revoking === r.id}
                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                    {revoking === r.id ? "…" : "Yes"}
                  </button>
                  <button onClick={() => setConfirmId(null)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800 transition">
                    No
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(r.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 text-xs font-semibold hover:bg-red-50 dark:bg-red-900/20 transition">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate code modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700">
            {newCode ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Code Generated!</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share this code with your vet. Direct them to:</p>
                  <p className="text-xs font-mono text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1 mt-1 break-all">{portalUrl}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 mb-4">
                  <span className="font-mono text-2xl font-bold tracking-[0.3em] text-green-800 dark:text-green-300">{newCode}</span>
                  <button onClick={() => copyCode(newCode)}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition">
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Add Vet Access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Optionally add vet details, then generate a secure access code.</p>
                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vet Name (optional)</label>
                    <input value={vetName} onChange={(e) => setVetName(e.target.value)}
                      placeholder="Dr. Sarah Johnson"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vet Email (optional)</label>
                    <input value={vetEmail} onChange={(e) => setVetEmail(e.target.value)}
                      type="email" placeholder="vet@clinic.com"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition">
                    Cancel
                  </button>
                  <button onClick={generate} disabled={generating}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60">
                    {generating ? "Generating…" : "Generate Code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
