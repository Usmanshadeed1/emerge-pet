"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { DailyLogin } from "./DailyLogin";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavUser {
  name?:         string | null;
  email?:        string | null;
  profileEmoji?: string | null;
  role?:         string;
}

const NAV_LINKS = [
  { href: "/dashboard",                 label: "Home" },
  { href: "/dashboard/reminders",       label: "Calendar" },
  { href: "/dashboard/symptom-checker", label: "Symptom Checker" },
  { href: "/dashboard/advisor",         label: "Advisor" },
  { href: "/dashboard/care-tips",       label: "Care Tips" },
  { href: "/dashboard/rewards",         label: "Rewards" },
  { href: "/dashboard/upgrade",         label: "⭐ Upgrade" },
  { href: "/dashboard/settings",        label: "Settings" },
];

export default function DashboardNav({ user }: { user: NavUser }) {
  const pathname            = usePathname();
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  const emoji    = user.profileEmoji;
  const isAdmin  = user.role === "ADMIN";

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <DailyLogin />

      {/* ── Desktop / Mobile header bar ── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600 text-sm">🐾</span>
            <span className="hidden sm:inline">EmergePet</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {/* Admin link — visible in nav bar for admin users */}
            {isAdmin && (
              <Link href="/admin"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                }`}>
                🛡 Admin
              </Link>
            )}
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side: theme toggle + user menu + hamburger */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* User avatar / menu */}
            <div className="relative">
              <button onClick={() => { setUserOpen((o) => !o); setMobileOpen(false); }}
                aria-label="User menu"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 text-sm font-semibold text-green-700 dark:text-green-300 ring-2 ring-transparent hover:ring-green-300 dark:hover:ring-green-600 transition-all focus-visible:outline-none focus-visible:ring-green-500">
                {emoji ?? initials}
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 shadow-xl">
                    <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name ?? "—"}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                          <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
                          Admin Panel
                        </Link>
                      )}
                      <Link href="/dashboard/settings" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                      </Link>
                      <button onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => { setMobileOpen((o) => !o); setUserOpen(false); }}
              aria-label="Toggle navigation menu"
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile slide-down menu ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-3">
            <nav className="px-4 pt-2 space-y-0.5">
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                      : "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  }`}>
                  🛡 Admin Panel
                </Link>
              )}
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}>
                  {label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
