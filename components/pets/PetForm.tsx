"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

const DOG_BREEDS = ["Australian Shepherd","Beagle","Bernese Mountain Dog","Border Collie","Boxer","Bulldog","Chihuahua","Cocker Spaniel","Dachshund","Doberman Pinscher","French Bulldog","German Shepherd","Golden Retriever","Great Dane","Havanese","Labrador Retriever","Maltese","Miniature Schnauzer","Mixed Breed","Pembroke Welsh Corgi","Pomeranian","Poodle","Rottweiler","Shih Tzu","Siberian Husky","Yorkshire Terrier","Other"];
const CAT_BREEDS = ["Abyssinian","Bengal","Birman","British Shorthair","Burmese","Domestic Longhair","Domestic Shorthair","Maine Coon","Mixed Breed","Norwegian Forest Cat","Persian","Ragdoll","Russian Blue","Scottish Fold","Siamese","Sphynx","Tonkinese","Other"];

export interface PetFormData {
  id?:          string;
  name:         string;
  species:      string;
  breed:        string;
  sex:          string;
  isNeutered:   boolean;
  dateOfBirth:  string;
  weight:       string;
  weightUnit:   "LBS" | "KG";
  color:        string;
  markings:     string;
  microchipId:  string;
  specialNotes: string;
  hasPhoto?:    boolean; // true if pet already has a photo in DB
}

interface Props {
  defaultValues?: Partial<PetFormData>;
  mode: "create" | "edit";
}

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export default function PetForm({ defaultValues, mode }: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<PetFormData>({
    name: "", species: "", breed: "", sex: "", isNeutered: false,
    dateOfBirth: "", weight: "", weightUnit: "LBS", color: "",
    markings: "", microchipId: "", specialNotes: "",
    ...defaultValues,
  });

  const [breedSearch,    setBreedSearch]    = useState("");
  const [photoPreview,   setPhotoPreview]   = useState(
    defaultValues?.hasPhoto && defaultValues?.id
      ? `/api/pets/${defaultValues.id}/photo`
      : ""
  );
  const [photoBase64,    setPhotoBase64]    = useState<string | null>(null);
  const [photoMimeType,  setPhotoMimeType]  = useState<string | null>(null);
  const [photoError,     setPhotoError]     = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  function set<K extends keyof PetFormData>(key: K, val: PetFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const breedList = form.species === "DOG" ? DOG_BREEDS : form.species === "CAT" ? CAT_BREEDS : [];
  const filtered  = breedList.filter((b) => b.toLowerCase().includes(breedSearch.toLowerCase()));

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");

    if (file.size > MAX_SIZE) {
      setPhotoError("Image must be under 2 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setPhotoError("Only JPG, PNG, WebP, or GIF images are allowed.");
      return;
    }

    // Show local preview immediately
    setPhotoPreview(URL.createObjectURL(file));

    // Convert to base64 for submission
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Strip the data URL prefix — keep only the raw base64
      const base64 = result.split(",")[1];
      setPhotoBase64(base64);
      setPhotoMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.species) {
      setError("Pet name and species are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const url    = mode === "edit" ? `/api/pets/${form.id}` : "/api/pets";
      const method = mode === "edit" ? "PATCH" : "POST";

      const payload = {
        ...form,
        // Only include photo fields if a new photo was selected
        ...(photoBase64 !== null && {
          photoBase64,
          photoMimeType,
        }),
      };

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return; }
      router.push(`/dashboard/pets/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all";
  const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">{error}</div>
      )}

      {/* ── Photo ── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Photo</h3>
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-all hover:border-green-400 hover:bg-green-50 dark:bg-green-900/20">
            {photoPreview
              ? <Image src={photoPreview} alt="preview" fill className="object-cover" unoptimized />
              : <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoChange} className="sr-only" />
          <div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
              {photoPreview ? "Change photo" : "Upload photo"}
            </button>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">JPG, PNG or WebP · max 2 MB</p>
            {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
          </div>
        </div>
      </div>

      {/* ── Basic Info ── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic info</h3>

        <div>
          <label className={labelCls}>Pet name <span className="text-red-400">*</span></label>
          <input type="text" placeholder="e.g. Buddy, Luna, Mochi" value={form.name}
            onChange={(e) => set("name", e.target.value)} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Species <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-4 gap-2">
            {SPECIES.map((s) => (
              <button key={s.value} type="button"
                onClick={() => { set("species", s.value); set("breed", ""); setBreedSearch(""); }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  form.species === s.value
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20/50"
                }`}>
                <span className="text-xl leading-none">{s.emoji}</span>
                <span className={`text-xs font-medium ${form.species === s.value ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(form.species === "DOG" || form.species === "CAT") && (
          <div>
            <label className={labelCls}>Breed <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
            {form.breed ? (
              <div className="flex items-center justify-between rounded-xl border border-green-500 bg-green-50 dark:bg-green-900/20 px-3.5 py-2.5 ring-2 ring-green-500/20">
                <span className="text-sm font-medium text-green-800 dark:text-green-300">{form.breed}</span>
                <button onClick={() => { set("breed", ""); setBreedSearch(""); }} type="button" className="text-green-600 hover:text-green-800 dark:text-green-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" placeholder={`Search ${form.species === "DOG" ? "dog" : "cat"} breeds…`}
                  value={breedSearch} onChange={(e) => setBreedSearch(e.target.value)} className={inputCls} />
                {breedSearch && (
                  <div className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                    {filtered.length === 0
                      ? <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No breeds found</div>
                      : filtered.map((b) => (
                          <button key={b} type="button" onClick={() => { set("breed", b); setBreedSearch(""); }}
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

      {/* ── Physical Details ── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Physical details</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Sex</label>
            <div className="grid grid-cols-2 gap-2">
              {(["MALE", "FEMALE"] as const).map((s) => (
                <button key={s} type="button" onClick={() => set("sex", form.sex === s ? "" : s)}
                  className={`flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition-all ${
                    form.sex === s
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-2 ring-green-500/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-green-300"
                  }`}>
                  {s === "MALE" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Birthday</label>
            <input type="date" value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Weight</label>
          <div className="flex gap-2">
            <input type="number" placeholder="0.0" min="0" step="0.1"
              value={form.weight} onChange={(e) => set("weight", e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              {(["LBS", "KG"] as const).map((u) => (
                <button key={u} type="button" onClick={() => set("weightUnit", u)}
                  className={`px-4 text-sm font-medium transition-colors ${form.weightUnit === u ? "bg-green-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-800"}`}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Color</label>
            <input type="text" placeholder="e.g. Golden, Black & White" value={form.color}
              onChange={(e) => set("color", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Markings</label>
            <input type="text" placeholder="e.g. White chest patch" value={form.markings}
              onChange={(e) => set("markings", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Medical Info ── */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Medical info</h3>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Spayed / Neutered</p>
          <button type="button" onClick={() => set("isNeutered", !form.isNeutered)}
            className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${form.isNeutered ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}
            role="switch" aria-checked={form.isNeutered}>
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow ring-0 transition-transform duration-200 ${form.isNeutered ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <div>
          <label htmlFor="chip" className={labelCls}>Microchip ID <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span></label>
          <input id="chip" type="text" placeholder="15-digit number" value={form.microchipId}
            onChange={(e) => set("microchipId", e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Special notes <span className="text-gray-400 dark:text-gray-500 font-normal">(allergies, conditions, medications)</span></label>
          <textarea rows={3} placeholder="e.g. Allergic to chicken, takes daily thyroid medication…"
            value={form.specialNotes} onChange={(e) => set("specialNotes", e.target.value)}
            className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:text-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex gap-3 pb-8">
        <button type="button" onClick={() => router.back()}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:bg-gray-800 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
          {loading ? "Saving…" : mode === "edit" ? "Save changes" : "Add pet"}
        </button>
      </div>
    </form>
  );
}
