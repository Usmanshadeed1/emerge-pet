import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPremium } from "@/lib/premium";
import PetDetailClient from "@/components/pets/PetDetailClient";

export default async function PetDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [pet, premium] = await Promise.all([
    db.pet.findUnique({ where: { id: params.id } }),
    isPremium(session.user.id),
  ]);

  if (!pet || pet.ownerId !== session.user.id) notFound();

  // Never send raw base64 to the client — replace with a boolean flag
  const { photoData, ...rest } = pet;
  const petForClient = {
    ...rest,
    hasPhoto: !!photoData,
    dateOfBirth: rest.dateOfBirth?.toISOString() ?? null,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
    breedGuideGeneratedAt: rest.breedGuideGeneratedAt?.toISOString() ?? null,
  };

  return <PetDetailClient pet={petForClient} isPremium={premium} />;
}
