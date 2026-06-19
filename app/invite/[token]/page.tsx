"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type InviteState = "loading" | "valid" | "invalid" | "accepting" | "done" | "error";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { status } = useSession();
  const router = useRouter();

  const [state, setState] = useState<InviteState>("loading");
  const [ownerName, setOwnerName] = useState("");
  const [message, setMessage] = useState("");

  // Validate the token on page load
  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/user/invite/validate?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setOwnerName(data.ownerName ?? "");
          setState("valid");
        } else {
          const data = await res.json().catch(() => ({}));
          setMessage(data.error ?? "This invite link is invalid or has expired.");
          setState("invalid");
        }
      } catch {
        setMessage("Could not validate this invite link.");
        setState("invalid");
      }
    }
    validate();
  }, [token]);

  async function handleAccept() {
    if (status === "unauthenticated") {
      // Redirect to login, preserving the token in the URL
      router.push(`/login?invite=${token}`);
      return;
    }

    setState("accepting");
    try {
      const res = await fetch("/api/user/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setOwnerName(data.ownerName ?? ownerName);
      } else {
        setMessage(data.error ?? "Failed to accept invite.");
        setState("error");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
      setState("error");
    }
  }

  // If user is logged in and invite is valid, auto-accept
  useEffect(() => {
    if (state === "valid" && status === "authenticated") {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, status]);

  if (state === "loading" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Checking your invite link…</p>
        </div>
      </div>
    );
  }

  if (state === "invalid" || state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid invite</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            Go to EmergePet
          </Link>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re in!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            You&apos;ve joined{ownerName ? ` ${ownerName}'s` : " their"} EmergePet family account.
            You can now view and manage their pets.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // valid — not yet logged in
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🐾</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Family invite</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {ownerName ? `${ownerName} invited you` : "You've been invited"} to join their EmergePet
          family account. Sign in or create an account to accept.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/login?invite=${token}`}
            className="block bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            Sign in to accept
          </Link>
          <Link
            href={`/signup?invite=${token}`}
            className="block border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:bg-gray-800"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
