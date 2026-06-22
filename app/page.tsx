import Link from "next/link";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
const FEATURES = [
  {
    icon: "🏥",
    title: "Health Records",
    desc:  "Centralise every vet visit, vaccine, medication, lab result, and surgery in one secure place.",
  },
  {
    icon: "🔔",
    title: "Smart Reminders",
    desc:  "Never miss a vaccination, grooming appointment, or medication dose with intelligent alerts.",
  },
  {
    icon: "🤖",
    title: "AI Symptom Checker",
    desc:  "Describe symptoms and receive instant, AI-powered guidance on urgency and next steps.",
  },
  {
    icon: "📊",
    title: "Health Score",
    desc:  "Get a personalised wellness score for each pet, updated after every record you log.",
  },
  {
    icon: "🔗",
    title: "Share Access",
    desc:  "Generate secure links for pet sitters and QR codes for vets — no account required.",
  },
  {
    icon: "🐾",
    title: "Breed Intelligence",
    desc:  "AI-generated breed guides with species-specific care tips tailored to your pet.",
  },
];

const FREE_FEATURES    = ["Up to 3 pets", "Health records", "Reminders & alerts", "QR code profiles", "Vet portal access"];
const PREMIUM_FEATURES = ["Unlimited pets", "AI Symptom Checker", "AI Health Score", "PDF record analysis", "Breed intelligence guides", "Pet sitter access", "Priority support"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-600 text-base">🐾</span>
            <span className="text-lg font-bold text-gray-900">EmergePet</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="hidden sm:block rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-white pt-20 pb-28">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-green-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
            <span>🐾</span> The all-in-one pet health platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Your pet&apos;s health,
            <span className="block text-green-600">always at your fingertips.</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 leading-relaxed">
            Store health records, set smart reminders, and get AI-powered insights — all in one beautiful app designed for caring pet owners.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all hover:-translate-y-0.5">
              Start for free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-sm text-gray-400">No credit card required · Free forever plan available</p>

          {/* Pet emoji row */}
          <div className="mt-14 flex justify-center gap-4 text-4xl select-none">
            {["🐕", "🐈", "🐇", "🐦", "🦎", "🐹"].map((emoji, i) => (
              <span key={i}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md shadow-gray-100 ring-1 ring-gray-100">
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything your pet needs</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From daily care to emergency moments — EmergePet keeps you prepared and your pets thriving.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="group rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-green-200 transition-all">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl group-hover:bg-green-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Create your account", desc: "Sign up free in under 30 seconds. No credit card needed." },
              { step: "2", title: "Add your pets",       desc: "Add a photo, basic details, and any existing health records." },
              { step: "3", title: "Stay on top of care", desc: "Set reminders, log records, and let AI do the heavy lifting." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-xl font-bold text-white shadow-md shadow-green-600/30">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple, honest pricing</h2>
            <p className="mt-4 text-lg text-gray-500">Start free. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Free</div>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-400 ml-1">/ forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="block w-full rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Get started free
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border-2 border-green-500 bg-gradient-to-b from-green-50 to-white p-8 shadow-xl shadow-green-600/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-green-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-600">Premium</div>
              <div className="mb-1">
                <span className="text-5xl font-extrabold text-gray-900">$4.99</span>
                <span className="text-gray-400 ml-1">/ month</span>
              </div>
              <p className="text-sm text-green-600 font-medium mb-6">or $39.99/year — Save 33%</p>
              <ul className="space-y-3 mb-8">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="block w-full rounded-xl bg-green-600 py-3 text-center text-sm font-semibold text-white shadow-md shadow-green-600/30 hover:bg-green-700 transition-colors">
                Start Premium free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Stay in the loop</h2>
          <p className="text-green-100 mb-8 text-lg">
            Get pet health tips, feature updates, and vet-approved advice — delivered monthly.
          </p>
          <NewsletterForm />
          <p className="mt-4 text-green-200 text-xs">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600 text-sm">🐾</span>
              <span className="font-bold text-gray-900">EmergePet</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                { href: "/signup",              label: "Sign up" },
                { href: "/login",               label: "Sign in" },
                { href: "#pricing",             label: "Pricing" },
                { href: "/dashboard/upgrade",   label: "Premium" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} EmergePet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
