type Action =
  | "delete_pet"
  | "delete_record"
  | "manage_subscription"
  | "generate_vet_code"
  | "revoke_vet_code"
  | "generate_sitter_link"
  | "revoke_sitter_link"
  | "write_record"
  | "write_reminder"
  | "complete_reminder";

const OWNER_ONLY_ACTIONS: Action[] = [
  "delete_pet",
  "delete_record",
  "manage_subscription",
  "generate_vet_code",
  "revoke_vet_code",
  "generate_sitter_link",
  "revoke_sitter_link",
];

export function canWrite(
  user: { id: string; role: string },
  action: Action
): boolean {
  if (user.role === "ADMIN") return true;
  if (OWNER_ONLY_ACTIONS.includes(action)) return false;
  // Family members can write_record, write_reminder, complete_reminder
  return true;
}

export function isOwner(userId: string, petOwnerId: string): boolean {
  return userId === petOwnerId;
}
