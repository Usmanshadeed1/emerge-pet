import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import PetForm from "@/components/pets/PetForm";

export default async function EditPetPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pet = await db.pet.findUnique({ where: { id: params.id } });
  if (!pet || pet.ownerId !== session.user.id) notFound();

  const defaults = {
    id:           pet.id,
    name:         pet.name,
    species:      pet.species,
    breed:        pet.breed        ?? "",
    sex:          pet.sex          ?? "",
    isNeutered:   pet.isNeutered,
    dateOfBirth:  pet.dateOfBirth  ? pet.dateOfBirth.toISOString().split("T")[0] : "",
    weight:       pet.weight       ? String(pet.weight) : "",
    weightUnit:   (pet.weightUnit  as "LBS" | "KG") ?? "LBS",
    color:        pet.color        ?? "",
    markings:     pet.markings     ?? "",
    microchipId:  pet.microchipId  ?? "",
    specialNotes: pet.specialNotes ?? "",
    hasPhoto:     !!pet.photoData,
  };

  return (
    <div className="mx-auto max-w-2xl anim-fade-in">
      <Link href={`/dashboard/pets/${pet.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Back to {pet.name}
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit {pet.name}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update {pet.name}&apos;s profile information.</p>
      </div>

      <PetForm mode="edit" defaultValues={defaults} />
    </div>
  );
}
