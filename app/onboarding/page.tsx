"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

// ─── Data ────────────────────────────────────────────────────────────────────

const SPECIES = [
  { value: "DOG",     label: "Dog",     emoji: "🐕" },
  { value: "CAT",     label: "Cat",     emoji: "🐱" },
  { value: "BIRD",    label: "Bird",    emoji: "🐦" },
  { value: "RABBIT",  label: "Rabbit",  emoji: "🐇" },
  { value: "FISH",    label: "Fish",    emoji: "🐠" },
  { value: "REPTILE", label: "Reptile", emoji: "🦎" },
  { value: "HAMSTER", label: "Hamster", emoji: "🐹" },
  { value: "OTHER",   label: "Other",   emoji: "🐾" },
];

const DOG_BREEDS = [
  "Australian Shepherd","Beagle","Bernese Mountain Dog","Border Collie","Boxer",
  "Bulldog","Chihuahua","Cocker Spaniel","Dachshund","Doberman Pinscher",
  "French Bulldog","German Shepherd","Golden Retriever","Great Dane","Havanese",
  "Labrador Retriever","Maltese","Miniature Schnauzer","Mixed Breed","Pomeranian",
  "Poodle","Pembroke Welsh Corgi","Rottweiler","Shih Tzu","Siberian Husky",
  "Yorkshire Terrier","Other",
];

const CAT_BREEDS = [
  "Abyssinian","Bengal","Birman","British Shorthair","Burmese",
  "Domestic Longhair","Domestic Shorthair","Maine Coon","Mixed Breed",
  "Norwegian Forest Cat","Persian","Ragdoll","Russian Blue","Scottish Fold",
  "Siamese","Sphynx","Tonkinese","Other",
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface PetForm {
  name:         string;
  species:      string;
  breed:        string;
  breedSearch:  string;
  sex:          string;
  isNeutered:   boolean;
  dateOfBirth:  string;
  weight:       string;
  weightUnit:   "LBS" | "KG";
  microchipId:  string;
  photoFile:    File | null;
  photoPreview: string;
}

const INITIAL: PetForm = {
  name: "", species: "", breed: "", breedSearch: "",
  sex: "", isNeutered: false, dateOfBirth: "", weight: "",
  weightUnit: "LBS", microchipId: "", photoFile: null, photoPreview: "",
};

const TOTAL_STEPS = 5;

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
            i < step  ? "bg-green-600 text-white" :
            i === step ? "bg-green-600 text-white ring-4 ring-green-200 dark:ring-green-800" :
                         "bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 ring-1 ring-gray-200 dark:ring-gray-700"
          }`}>
            {i < step
              ? <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              : i + 1}
          </div>
          {i < TOTAL_STEPS - 1 && (
            <div className={`h-0.5 w-8 rounded-full transition-all duration-300 ${i < step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { update }        = useSession();
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState<PetForm>(INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef           = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof PetForm>(key: K, val: PetForm[K]) =>
    setForm((f) => ({ ...f, [key]: val })), []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("photoFile", file);
    const reader = new FileReader();
    reader.onload = (ev) => set("photoPreview", ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function breedList() {
    if (form.species === "DOG") return DOG_BREEDS;
    if (form.species === "CAT") return CAT_BREEDS;
    return [];
  }

  const filteredBreeds = breedList().filter((b) =>
    b.toLowerCase().includes(form.breedSearch.toLowerCase())
  );

  async function handleFinish(choice: "request_vet" | "add_manual") {
    setLoading(true);
    setError("");
    try {
      let photoBase64: string | null = null;
      let photoMimeType: string | null = null;
      if (form.photoFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = (e) => resolve(e.target!.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(form.photoFile!);
        });
        // Strip data URL prefix — keep raw base64 only
        photoBase64 = dataUrl.split(",")[1];
        photoMimeType = form.photoFile.type;
      }

      const res  = await fetch("/api/onboarding/complete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          form.name,
          species:       form.species,
          breed:         form.breed || null,
          sex:           form.sex   || null,
          isNeutered:    form.isNeutered,
          dateOfBirth:   form.dateOfBirth || null,
          weight:        form.weight     || null,
          weightUnit:    form.weightUnit,
          microchipId:   form.microchipId || null,
          photoBase64,
          photoMimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return; }

      await update({ onboardingCompleted: true });
      // Hard redirect so middleware reads the updated onboardingCompleted from DB
      window.location.href = choice === "request_vet"
        ? `/dashboard?petId=${data.petId}&action=request_records`
        : "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Screen 0: Welcome ────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 anim-scale-in">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-600 text-4xl shadow-xl shadow-green-600/30">
            🐾
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your pet&apos;s health, all in one place
          </h1>
          <p className="mt-3 text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            EmergePet keeps every health record, reminder, and vet visit organised — so you&apos;re always prepared.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition-all hover:bg-green-700 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              Get Started
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500">Takes about 2 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 1: Pet Name & Species ─────────────────────────────────────────

  if (step === 1) {
    const showBreeds = form.species === "DOG" || form.species === "CAT";
    const canAdvance = !!form.name.trim() && !!form.species;

    return (
      <div className="flex flex-1 flex-col items-center justify-start px-4 py-10 anim-slide-up">
        <div className="w-full max-w-lg">
          <StepBar step={step - 1} />

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tell us about your pet</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">What&apos;s their name and what kind of animal are they?</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-7 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 space-y-6">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Pet name</label>
              <input
                type="text" placeholder="e.g. Buddy, Luna, Mochi"
                value={form.name} onChange={(e) => set("name", e.target.value)}
                className="input-field w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
            </div>

            {/* Species grid */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Species</label>
              <div className="grid grid-cols-4 gap-2.5">
                {SPECIES.map((s) => (
                  <button key={s.value} type="button" onClick={() => { set("species", s.value); set("breed", ""); set("breedSearch", ""); }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all border ${
                      form.species === s.value
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20/50"
                    }`}>
                    <span className="text-2xl leading-none">{s.emoji}</span>
                    <span className={`text-xs font-medium ${form.species === s.value ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Breed search */}
            {showBreeds && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Breed <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
                {form.breed ? (
                  <div className="flex items-center justify-between rounded-xl border border-green-500 bg-green-50 dark:bg-green-900/20 px-3.5 py-2.5 ring-2 ring-green-500/20">
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">{form.breed}</span>
                    <button onClick={() => { set("breed", ""); set("breedSearch", ""); }} className="text-green-600 hover:text-green-800 dark:text-green-300">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" placeholder={`Search ${form.species === "DOG" ? "dog" : "cat"} breeds…`}
                      value={form.breedSearch} onChange={(e) => set("breedSearch", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 dark:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
                    {form.breedSearch && (
                      <div className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                        {filteredBreeds.length === 0
                          ? <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No breeds found</div>
                          : filteredBreeds.map((b) => (
                              <button key={b} type="button" onClick={() => { set("breed", b); set("breedSearch", ""); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:bg-green-900/20 hover:text-green-700 dark:text-green-400 transition-colors">
                                {b}
                              </button>
                            ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep(0)} className="flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back
            </button>
            <button onClick={() => setStep(2)} disabled={!canAdvance}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
              Continue
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 2: Basic Details ───────────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="flex flex-1 flex-col items-center justify-start px-4 py-10 anim-slide-up">
        <div className="w-full max-w-lg">
          <StepBar step={step - 1} />

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic details</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Help us personalize {form.name}&apos;s health profile.</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-7 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 space-y-5">
            {/* Sex toggle */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sex</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(["MALE", "FEMALE"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => set("sex", form.sex === s ? "" : s)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all ${
                      form.sex === s
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-2 ring-green-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20/50"
                    }`}>
                    {s === "MALE" ? "♂ Male" : "♀ Female"}
                  </button>
                ))}
              </div>
            </div>

            {/* Neutered toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Spayed / Neutered</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Has your pet been altered?</p>
              </div>
              <button type="button" onClick={() => set("isNeutered", !form.isNeutered)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${form.isNeutered ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}
                role="switch" aria-checked={form.isNeutered}>
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition-transform duration-200 ${form.isNeutered ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Birthday */}
            <div>
              <label htmlFor="dob" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Birthday <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <input type="date" id="dob" value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
            </div>

            {/* Weight */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Weight <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input type="number" placeholder="0.0" min="0" step="0.1"
                  value={form.weight} onChange={(e) => set("weight", e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {(["LBS", "KG"] as const).map((u) => (
                    <button key={u} type="button" onClick={() => set("weightUnit", u)}
                      className={`px-4 text-sm font-medium transition-colors ${form.weightUnit === u ? "bg-green-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800"}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Microchip */}
            <div>
              <label htmlFor="chip" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Microchip ID <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <input type="text" id="chip" placeholder="15-digit number"
                value={form.microchipId} onChange={(e) => set("microchipId", e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep(1)} className="flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back
            </button>
            <button onClick={() => setStep(3)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700">
              Continue
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 3: Pet Photo ───────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 anim-slide-up">
        <div className="w-full max-w-md">
          <StepBar step={step - 1} />

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add a photo</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">A photo helps identify {form.name} in an emergency.</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-8 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 flex flex-col items-center gap-6">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />

            {/* Photo preview circle */}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative flex h-36 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-all hover:border-green-400 hover:bg-green-50 dark:bg-green-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
              {form.photoPreview ? (
                <Image src={form.photoPreview} alt="Pet preview" fill className="object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="text-xs font-medium">Upload photo</span>
                </div>
              )}
            </button>

            {form.photoPreview && (
              <button onClick={() => fileRef.current?.click()}
                className="text-sm font-medium text-green-600 hover:underline">
                Change photo
              </button>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Choose from library
            </button>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => setStep(2)} className="flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back
            </button>
            <button onClick={() => setStep(4)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700">
              {form.photoPreview ? "Continue" : "Skip for now"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen 4: First Record ────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 anim-slide-up">
      <div className="w-full max-w-lg">
        <StepBar step={3} />

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add your first record</h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">How would you like to get {form.name}&apos;s health history started?</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Request from vet */}
          <button type="button" onClick={() => handleFinish("request_vet")} disabled={loading}
            className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 text-left shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 transition-all hover:ring-green-400 hover:shadow-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 ring-1 ring-green-100 dark:ring-green-900">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Request records from vet</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">We&apos;ll send a link to your vet to upload {form.name}&apos;s history directly.</p>
            </div>
          </button>

          {/* Add manually */}
          <button type="button" onClick={() => handleFinish("add_manual")} disabled={loading}
            className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-6 text-left shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 transition-all hover:ring-green-400 hover:shadow-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 ring-1 ring-blue-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Add a record manually</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Log vaccinations, visits, or medications yourself — takes just a minute.</p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Setting up {form.name}&apos;s profile…
          </div>
        )}

        <button onClick={() => setStep(3)} className="mt-5 flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back
        </button>
      </div>
    </div>
  );
}
