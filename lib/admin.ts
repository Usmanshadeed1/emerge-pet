import { Session } from "next-auth";

export function requireAdmin(session: Session | null): void {
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Forbidden: admin access required");
  }
}
