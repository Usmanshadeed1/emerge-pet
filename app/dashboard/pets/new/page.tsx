import Link from "next/link";
import PetForm from "@/components/pets/PetForm";

export default function NewPetPage() {
  return (
    <div className="mx-auto max-w-2xl anim-fade-in">
      {/* Back */}
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Back to dashboard
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add a new pet</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Fill in as much as you know — you can always update later.</p>
      </div>

      <PetForm mode="create" />
    </div>
  );
}
