"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Pet   { id: string; name: string; species: string }
interface Sub   { plan: string; status: string }
interface User  {
  id:                  string;
  name:                string | null;
  email:               string;
  role:                string;
  isActive:            boolean;
  onboardingCompleted: boolean;
  createdAt:           string;
  _count:              { pets: number };
  subscription:        Sub | null;
  pets:                Pet[];
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
      active
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-800"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
      {active ? "Active" : "Deactivated"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
      role === "ADMIN"
        ? "bg-violet-100 text-violet-700"
        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
    }`}>
      {role}
    </span>
  );
}

function SubBadge({ sub }: { sub: Sub | null }) {
  if (!sub) return <span className="text-xs text-gray-400 dark:text-gray-500">Free</span>;
  const color =
    sub.status === "ACTIVE"    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-800" :
    sub.status === "CANCELLED" ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ring-gray-200 dark:ring-gray-700"  :
                                  "bg-red-50 dark:bg-red-900/20 text-red-600 ring-red-200 dark:ring-red-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${color}`}>
      {sub.plan} · {sub.status}
    </span>
  );
}

export default function AdminUsersPage() {
  const { data: sessionData } = useSession();
  const myId = sessionData?.user?.id;

  const [users,    setUsers]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    const res  = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const data = await res.json() as User[];
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query, load]);

  async function toggleActive(user: User) {
    setToggling(`active-${user.id}`);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !user.isActive }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isActive: !user.isActive } : u)
      );
    }
    setToggling(null);
  }

  async function toggleRole(user: User) {
    const newRole = user.role === "ADMIN" ? "OWNER" : "ADMIN";
    const confirmed = window.confirm(
      newRole === "ADMIN"
        ? `Promote ${user.name ?? user.email} to Admin? They will have full access to this admin panel.`
        : `Remove admin access from ${user.name ?? user.email}? They will become a regular user.`
    );
    if (!confirmed) return;

    setToggling(`role-${user.id}`);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u)
      );
    }
    setToggling(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage all registered users.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
                  <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-3xl mb-3">👤</span>
            <p className="font-medium text-gray-700 dark:text-gray-300">No users found</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Try adjusting your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <span>User</span>
              <span>Role</span>
              <span>Pets</span>
              <span>Plan</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>

            {users.map((user) => {
              const isMe = user.id === myId;
              return (
                <div key={user.id}>
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                        className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-teal-500 text-sm font-bold text-white"
                      >
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </button>
                      <div className="min-w-0">
                        <button
                          onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                          className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-green-700 dark:text-green-400 truncate text-left"
                        >
                          {user.name ?? "(no name)"}
                          {isMe && <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(you)</span>}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      <svg
                        onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                        className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform cursor-pointer ${expanded === user.id ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>

                    <RoleBadge role={user.role} />

                    <span className="text-sm text-gray-600 dark:text-gray-400 text-center">{user._count.pets}</span>

                    <SubBadge sub={user.subscription} />

                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>

                    {/* Actions column */}
                    <div className="flex items-center gap-2">
                      {isMe ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Your account</span>
                      ) : (
                        <>
                          {/* Promote / Demote button */}
                          <button
                            onClick={() => toggleRole(user)}
                            disabled={toggling === `role-${user.id}`}
                            title={user.role === "ADMIN" ? "Remove admin access" : "Make admin"}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
                              user.role === "ADMIN"
                                ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-violet-100 hover:text-violet-700"
                            }`}
                          >
                            {toggling === `role-${user.id}`
                              ? "…"
                              : user.role === "ADMIN" ? "Remove Admin" : "Make Admin"}
                          </button>

                          {/* Active toggle (only for non-admin users) */}
                          {user.role !== "ADMIN" && (
                            <>
                              <StatusBadge active={user.isActive} />
                              <button
                                onClick={() => toggleActive(user)}
                                disabled={toggling === `active-${user.id}`}
                                title={user.isActive ? "Deactivate" : "Reactivate"}
                                className={`flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all disabled:opacity-50 ${
                                  user.isActive ? "bg-green-500" : "bg-gray-300"
                                }`}
                              >
                                <span className={`h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${
                                  user.isActive ? "translate-x-5" : "translate-x-0.5"
                                }`} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded: pet list */}
                  {expanded === user.id && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3">
                      {user.pets.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No pets registered</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.pets.map((pet) => (
                            <span key={pet.id} className="rounded-lg bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700">
                              🐾 {pet.name} <span className="text-gray-400 dark:text-gray-500">· {pet.species.toLowerCase()}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
