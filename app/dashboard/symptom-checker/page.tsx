import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isPremium } from "@/lib/premium";
import { db } from "@/lib/db";
import SymptomCheckerClient from "./SymptomCheckerClient";

export const metadata = {
  title:       "Symptom Checker — EmergePet",
  description: "AI-powered pet symptom analysis",
};

export default async function SymptomCheckerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [premium, pets] = await Promise.all([
    isPremium(session.user.id),
    db.pet.findMany({
      where:   { ownerId: session.user.id },
      select:  { id: true, name: true, species: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return <SymptomCheckerClient isPremium={premium} pets={pets} />;
}
