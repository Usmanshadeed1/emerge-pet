"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { SitterAccessSection } from "@/components/settings/SitterAccessSection";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const EMOJI_OPTIONS = [
  "🐾","🐕","🐱","🐶","🐈","🦮","🐩","🐕‍🦺","🐈‍⬛","🦁",
  "🐯","🐻","🐼","🦊","🦝","🐺","🦜","🐢","🦎","🐠",
];

interface Profile {
  name:         string;
  email:        string;
  profileEmoji: string | null;
  createdAt:    string;
}

export default function SettingsPage() {
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [name, setName]             = useState("");
  const [selectedEmoji, setEmoji]   = useState<string | null>(null);
  const [saveState, setSaveState]   = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [showDelete, setShowDelete]   = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [inviteCopied, setInviteCopied] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwState, setPwState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setEmoji(data.profileEmoji ?? null);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    const res = await fetch("/api/user/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, profileEmoji: selectedEmoji }),
    });
    setSaveState(res.ok ? "saved" : "error");
    if (res.ok) setTimeout(() => setSaveState("idle"), 2500);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwState("saving");
    const res  = await fetch("/api/user/password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPwError(data.error ?? "Failed to update password.");
      setPwState("error");
      return;
    }
    setPwState("saved");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwState("idle"), 2500);
  }

  async function handleCopyInvite() {
    const res  = await fetch("/api/user/invite", { method: "POST" });
    const data = await res.json() as { link?: string; error?: string };
    if (!res.ok || !data.link) return;
    await navigator.clipboard.writeText(data.link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/user/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "Failed to delete account.");
      setDeleting(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 anim-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your profile and account preferences.</p>
      </div>

      {/* ── Profile Card ──────────────────────────────── */}
      <form onSubmit={handleSave} className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile</h2>

        {/* Emoji picker */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Profile emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e === selectedEmoji ? null : e)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all ${
                  selectedEmoji === e
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                }`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Display name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
          <input type="email" value={profile.email} readOnly
            className="w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-500 dark:text-gray-400 outline-none cursor-default" />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saveState === "saving"}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-md shadow-green-600/25 hover:bg-green-700 transition-all disabled:opacity-60">
            {saveState === "saving" && <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
            {saveState === "saved" ? "✓ Saved!" : saveState === "saving" ? "Saving…" : "Save changes"}
          </button>
          {saveState === "error" && <p className="text-sm text-red-600">Failed to save. Try again.</p>}
        </div>
      </form>

      {/* ── Change Password ───────────────────────────── */}
      <form onSubmit={handlePasswordChange} className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change password</h2>

        <div>
          <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Current password</label>
          <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
          <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" minLength={8}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
        </div>

        {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={pwState === "saving"}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-md shadow-green-600/25 hover:bg-green-700 transition-all disabled:opacity-60">
            {pwState === "saving" && <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
            {pwState === "saved" ? "✓ Password updated!" : pwState === "saving" ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>

      {/* ── Family Invite ─────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Family access</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Invite a family member to view and manage your pets&apos; health records together.</p>
        <button type="button" onClick={handleCopyInvite}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
          {inviteCopied
            ? <><svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Link copied!</>
            : <><svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg> Copy invite link</>}
        </button>
      </div>

      {/* ── Sitter Access ─────────────────────────────── */}
      <SitterAccessSection />

      {/* ── Appearance ────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Switch between light and dark mode</p>
          </div>
          <ThemeToggle className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
        </div>
      </div>

      {/* ── Danger Zone ───────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-red-200 dark:ring-red-800 space-y-3">
        <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button type="button" onClick={() => setShowDelete(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 transition-all">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          Delete my account
        </button>
      </div>

      {/* ── Delete Modal ──────────────────────────────── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-7 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 anim-scale-in">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 ring-1 ring-red-100 dark:ring-red-900">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete account</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This will permanently delete your account, all pets, health records, and data. There is no way to undo this.
            </p>
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE" autoComplete="off"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all" />
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteInput(""); setDeleteError(""); }}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteInput !== "DELETE" || deleting}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                {deleting && <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
