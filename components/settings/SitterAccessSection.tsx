"use client";

import { useState, useEffect, useCallback } from "react";

interface Pet {
  id:      string;
  name:    string;
  species: string;
}

interface SitterLink {
  id:        string;
  label:     string | null;
  token:     string;
  url:       string;
  expiresAt: string;
  petIds:    string[];
  isActive:  boolean;
  createdAt: string;
  revokedAt: string | null;
}

const DURATION_OPTIONS = [
  { days: 1,  label: "1 day" },
  { days: 3,  label: "3 days" },
  { days: 7,  label: "1 week" },
  { days: 30, label: "30 days" },
];

export function SitterAccessSection() {
  const [links,       setLinks]       = useState<SitterLink[]>([]);
  const [pets,        setPets]        = useState<Pet[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);

  // Form state
  const [label,       setLabel]       = useState("");
  const [expiresIn,   setExpiresIn]   = useState(7);
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [creating,    setCreating]    = useState(false);
  const [newLink,     setNewLink]     = useState<SitterLink | null>(null);
  const [copied,      setCopied]      = useState(false);

  // Revoke state
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [revoking,    setRevoking]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [linksRes, petsRes] = await Promise.all([
        fetch("/api/sitter-access"),
        fetch("/api/pets"),
      ]);
      const [linksData, petsData] = await Promise.all([linksRes.json(), petsRes.json()]);
      setLinks(linksData ?? []);
      setPets(petsData ?? []);
      if (petsData?.length > 0) setSelectedPets([petsData[0].id]);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function togglePet(id: string) {
    setSelectedPets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function create() {
    if (selectedPets.length === 0) return;
    setCreating(true);
    try {
      const res  = await fetch("/api/sitter-access", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ label: label || null, expiresIn, petIds: selectedPets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed.");
      setNewLink(data as SitterLink);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create link.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    setRevoking(id);
    try {
      await fetch(`/api/sitter-access/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setRevoking(null);
      setConfirmId(null);
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetForm() {
    setLabel("");
    setExpiresIn(7);
    setSelectedPets(pets.length > 0 ? [pets[0].id] : []);
    setNewLink(null);
    setShowForm(false);
  }

  const activeLinks   = links.filter((l) => l.isActive && new Date(l.expiresAt) > new Date());
  const expiredLinks  = links.filter((l) => !l.isActive || new Date(l.expiresAt) <= new Date());

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pet Sitter Access</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Generate temporary links so sitters can view your pets&apos; care info</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Link
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-4">
          {newLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-base">✅</div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Sitter link created!</p>
              </div>
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 flex items-center gap-3">
                <p className="flex-1 text-sm font-mono text-green-800 dark:text-green-300 break-all">{newLink.url}</p>
                <button
                  onClick={() => copyLink(newLink.url)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expires: <span className="font-medium">{new Date(newLink.expiresAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
              </p>
              <button onClick={resetForm} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 underline">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Label <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Weekend trip, Sarah the sitter"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Link expires after</label>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map(({ days, label: lbl }) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExpiresIn(days)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                        expiresIn === days
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pet selector */}
              {pets.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Include pets</label>
                  <div className="flex flex-wrap gap-2">
                    {pets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePet(p.id)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition ${
                          selectedPets.includes(p.id)
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition">
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={creating || selectedPets.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create Sitter Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active links */}
      <div className="px-6 py-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />)}
          </div>
        ) : activeLinks.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 text-2xl">🔗</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No active sitter links</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create a link to share with your pet sitter</p>
          </div>
        ) : (
          <>
            {activeLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active</p>
                {activeLinks.map((link) => (
                  <div key={link.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{link.label ?? "Sitter link"}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Expires {new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <button
                          onClick={() => copyLink(link.url)}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                          {copied ? "Copied!" : "Copy link"}
                        </button>
                      </div>
                      {confirmId === link.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Revoke?</span>
                          <button onClick={() => revoke(link.id)} disabled={revoking === link.id}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition">
                            {revoking === link.id ? "…" : "Yes"}
                          </button>
                          <button onClick={() => setConfirmId(null)}
                            className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800 transition">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(link.id)}
                          className="shrink-0 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 text-xs font-semibold hover:bg-red-50 dark:bg-red-900/20 transition">
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expiredLinks.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Expired / Revoked</p>
                {expiredLinks.map((link) => (
                  <div key={link.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4 opacity-60">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{link.label ?? "Sitter link"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {link.revokedAt ? `Revoked ${new Date(link.revokedAt).toLocaleDateString()}` : `Expired ${new Date(link.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
