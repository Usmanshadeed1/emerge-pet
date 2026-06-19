const features = [
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    text: "All health records in one secure place",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    text: "AI symptom checker & health insights",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    text: "QR code emergency sharing — any vet, anywhere",
  },
  {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    text: "Smart reminders so nothing gets missed",
  },
];

export default function AuthBrandPanel() {
  return (
    <aside className="brand-panel-bg relative hidden w-[420px] flex-shrink-0 flex-col overflow-hidden lg:flex xl:w-[460px]">

      {/* Large decorative paw watermark */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 select-none text-[280px] opacity-[0.04]">
        🐾
      </div>

      {/* Top glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-green-500/10 blur-3xl" />

      <div className="relative flex h-full flex-col px-10 py-10 xl:px-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl backdrop-blur-sm">
            🐾
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            EmergePet
          </span>
        </div>

        {/* Headline */}
        <div className="mt-14">
          <p className="text-xs font-medium uppercase tracking-widest text-green-400">
            Pet health platform
          </p>
          <h2
            className="mt-3 font-display text-4xl font-semibold leading-tight text-white xl:text-[2.6rem]"
          >
            Your pet&apos;s health,{" "}
            <span className="text-green-300">always within reach.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-green-200/80">
            Store records, get AI insights, and share emergency info with any vet
            — instantly.
          </p>
        </div>

        {/* Feature list */}
        <ul className="mt-10 space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/20 text-green-300">
                {f.icon}
              </div>
              <span className="text-sm text-green-100/90">{f.text}</span>
            </li>
          ))}
        </ul>

        {/* Testimonial */}
        <div className="mt-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex gap-0.5 text-green-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="mt-3 text-sm italic leading-relaxed text-white/80">
              &ldquo;EmergePet had all of Milo&apos;s records ready when we rushed to the emergency vet at 2am. It genuinely made a difference.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/30 text-xs">
                🐕
              </div>
              <div>
                <p className="text-xs font-medium text-white">Sarah M.</p>
                <p className="text-xs text-green-400/70">Golden Retriever owner</p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-green-500/60">
            Trusted by 10,000+ pet parents worldwide
          </p>
        </div>
      </div>
    </aside>
  );
}
