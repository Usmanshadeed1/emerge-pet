import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} font-sans relative min-h-screen overflow-hidden flex flex-col`}
      style={{
        background:
          "radial-gradient(ellipse 90% 65% at 10% 0%, rgba(134,239,172,0.32) 0%, transparent 55%), " +
          "radial-gradient(ellipse 70% 55% at 90% 10%, rgba(110,231,183,0.20) 0%, transparent 52%), " +
          "radial-gradient(ellipse 80% 60% at 55% 100%, rgba(167,243,208,0.25) 0%, transparent 58%), " +
          "#f0fdf4",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full bg-green-300/20 blur-[120px]" />
        <div className="absolute -top-24 right-[-80px] h-[400px] w-[400px] rounded-full bg-emerald-200/25 blur-[100px]" />
        <div className="absolute bottom-[-60px] left-1/2 h-[360px] w-[700px] -translate-x-1/2 rounded-full bg-green-200/20 blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
