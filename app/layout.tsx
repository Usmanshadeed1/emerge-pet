import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s — EmergePet",
    default:  "EmergePet — Smart Pet Health Management",
  },
  description:
    "Keep all your pet's health information in one place. Set reminders, get AI health insights, and share emergency info instantly.",
  keywords: ["pet health", "pet records", "vet app", "pet care", "AI symptom checker"],
  openGraph: {
    title:       "EmergePet — Smart Pet Health Management",
    description: "The all-in-one pet health platform. Track records, reminders, AI insights, and more.",
    siteName:    "EmergePet",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "EmergePet — Smart Pet Health Management",
    description: "Track pet health records, set reminders, and get AI-powered insights.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${dmSans.variable} font-sans antialiased bg-[--background] text-[--foreground]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
