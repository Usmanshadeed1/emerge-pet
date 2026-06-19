"use client";

import { useState } from "react";

interface Props {
  petId:     string;
  petName:   string;
  isPremium: boolean;
}

export function QrCodeTab({ petId, petName, isPremium }: Props) {
  const qrSrc = `/api/pets/${petId}/qr`;

  async function download() {
    const res  = await fetch(qrSrc);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${petName.replace(/\s+/g, "-")}-qr-code.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-100 dark:ring-amber-900 flex items-center justify-center mb-4 text-3xl">🔒</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">QR Code is a Premium Feature</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Upgrade to EmergePet Premium to generate a QR code for {petName}. Anyone who scans it can see their emergency info instantly — no login needed.
        </p>
        <a
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition"
        >
          Upgrade to Premium
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 px-4 gap-6">
      {/* QR Code image */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={`QR code for ${petName}`}
          width={240}
          height={240}
          className="rounded-lg"
        />
      </div>

      {/* Instruction text */}
      <div className="max-w-sm text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Print this on a collar tag or save it to your phone. Anyone who scans it can see {petName}&apos;s emergency information instantly — no login required.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={download}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download QR
        </button>
        <CopyLinkButton petId={petId} />
      </div>
    </div>
  );
}

function CopyLinkButton({ petId }: { petId: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function copy() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pets/${petId}/qr-token`);
      if (res.ok) {
        const { token } = await res.json();
        await navigator.clipboard.writeText(`${window.location.origin}/emergency/${token}`);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={copy}
      disabled={loading}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition disabled:opacity-60"
    >
      {copied ? (
        <>
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          Copy Link
        </>
      )}
    </button>
  );
}
