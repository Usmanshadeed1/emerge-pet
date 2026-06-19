import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: {
    template: "%s — EmergePet",
    default:  "EmergePet",
  },
  description: "Sign in to EmergePet — the smart pet health management platform.",
  openGraph: {
    siteName: "EmergePet",
    type:     "website",
  },
};

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} font-sans relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-16 bg-[#f0fdf4] dark:bg-gray-950`}
    >
      {/* Soft blobs — light mode */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden" aria-hidden="true">
        <div className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full bg-green-300/20 blur-[120px]" />
        <div className="absolute -top-24 right-[-80px] h-[400px] w-[400px] rounded-full bg-emerald-200/25 blur-[100px]" />
        <div className="absolute bottom-[-60px] left-1/2 h-[360px] w-[700px] -translate-x-1/2 rounded-full bg-green-200/20 blur-[100px]" />
      </div>
      {/* Dark mode blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block" aria-hidden="true">
        <div className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full bg-green-900/20 blur-[120px]" />
        <div className="absolute -top-24 right-[-80px] h-[400px] w-[400px] rounded-full bg-emerald-900/20 blur-[100px]" />
      </div>

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
