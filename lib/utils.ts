export function speciesEmoji(species: string): string {
  const map: Record<string, string> = {
    DOG: "🐕", CAT: "🐱", BIRD: "🐦", RABBIT: "🐇",
    FISH: "🐠", REPTILE: "🦎", HAMSTER: "🐹", OTHER: "🐾",
  };
  return map[species] ?? "🐾";
}

export function formatSpecies(species: string): string {
  return species.charAt(0) + species.slice(1).toLowerCase();
}

export function petAge(dob: string | Date | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now   = new Date();
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (totalMonths < 1)  return "< 1 mo";
  if (totalMonths < 12) return `${totalMonths} mo`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export function formatWeight(weight: number | null, unit: string): string {
  if (!weight) return "";
  return `${weight} ${unit.toLowerCase()}`;
}
