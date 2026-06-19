import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  try {
    // Delete in dependency order — innermost first
    const pets = await db.pet.findMany({ where: { ownerId: userId }, select: { id: true } });
    const petIds = pets.map((p) => p.id);

    if (petIds.length > 0) {
      await db.vetVisitNote.deleteMany({ where: { petId: { in: petIds } } });
      await db.recordRequest.deleteMany({ where: { petId: { in: petIds } } });
      await db.vetAccess.deleteMany({ where: { petId: { in: petIds } } });
      await db.reminder.deleteMany({ where: { petId: { in: petIds } } });
      await db.vaccine.deleteMany({ where: { petId: { in: petIds } } });
      await db.healthRecord.deleteMany({ where: { petId: { in: petIds } } });
      await db.pet.deleteMany({ where: { ownerId: userId } });
    }

    await db.sitterAccess.deleteMany({ where: { ownerId: userId } });

    await db.pointTransaction.deleteMany({ where: { userId } });
    await db.achievement.deleteMany({ where: { userId } });
    await db.rewardPoints.deleteMany({ where: { userId } });
    await db.aiChatHistory.deleteMany({ where: { userId } });
    await db.subscription.deleteMany({ where: { userId } });
    await db.familyMember.deleteMany({ where: { OR: [{ userId }, { memberId: userId }] } });
    await db.session.deleteMany({ where: { userId } });
    await db.account.deleteMany({ where: { userId } });
    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}
