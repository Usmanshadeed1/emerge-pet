// Brand → generic drug name map for common veterinary medications (30+ entries)
const DRUG_MAP: Record<string, string> = {
  // NSAIDs / Pain
  rimadyl: "carprofen",
  carprieve: "carprofen",
  novox: "carprofen",
  vetprofen: "carprofen",
  metacam: "meloxicam",
  loxicom: "meloxicam",
  meloxidyl: "meloxicam",
  galliprant: "grapiprant",
  onsior: "robenacoxib",
  deramaxx: "deracoxib",
  previcox: "firocoxib",
  zubrin: "tepoxalin",
  ultram: "tramadol",
  neurontin: "gabapentin",
  luminal: "phenobarbital",
  // Allergy / Immunomodulatory
  apoquel: "oclacitinib",
  cytopoint: "lokivetmab",
  atopica: "cyclosporine",
  // Anti-nausea / GI
  cerenia: "maropitant",
  reglan: "metoclopramide",
  pepcid: "famotidine",
  prilosec: "omeprazole",
  // Cardiac
  vetmedin: "pimobendan",
  enacard: "enalapril",
  vasotec: "enalapril",
  fortekor: "benazepril",
  lotensin: "benazepril",
  lasix: "furosemide",
  salix: "furosemide",
  lanoxin: "digoxin",
  tenormin: "atenolol",
  aldactone: "spironolactone",
  // Thyroid
  soloxine: "levothyroxine",
  // Antibiotics
  amoxil: "amoxicillin",
  clavamox: "amoxicillin-clavulanate",
  keflex: "cephalexin",
  convenia: "cefovecin",
  baytril: "enrofloxacin",
  zeniquin: "marbofloxacin",
  antirobe: "clindamycin",
  vibramycin: "doxycycline",
  flagyl: "metronidazole",
  // Steroids
  deltasone: "prednisone",
  pediapred: "prednisolone",
  "solu-medrol": "methylprednisolone",
  // Parasiticides
  bravecto: "fluralaner",
  nexgard: "afoxolaner",
  simparica: "sarolaner",
  credelio: "lotilaner",
  frontline: "fipronil",
  heartgard: "ivermectin/pyrantel",
  revolution: "selamectin",
  interceptor: "milbemycin oxime",
  sentinel: "milbemycin oxime/lufenuron",
  trifexis: "spinosad/milbemycin oxime",
  advantage: "imidacloprid",
  "k9 advantix": "imidacloprid/permethrin",
  seresto: "imidacloprid/flumethrin",
  comfortis: "spinosad",
};

export function normalizeDrugName(input: string): string {
  const key = input.toLowerCase().trim();
  return DRUG_MAP[key] ?? input.trim();
}

// RxNorm lookup — free NIH API, no key required
async function rxNormLookup(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as { idGroup?: { rxnormId?: string[] } };
    const rxcui = data.idGroup?.rxnormId?.[0];
    if (!rxcui) return null;

    const propRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!propRes.ok) return null;
    const propData = await propRes.json() as { properties?: { name?: string } };
    return propData.properties?.name?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function normalizeDrugNameWithFallback(
  input: string
): Promise<{ normalizedDrugName: string; brandDrugName: string | null }> {
  const trimmed = input.trim();
  const local = normalizeDrugName(trimmed);

  if (local.toLowerCase() !== trimmed.toLowerCase()) {
    return { normalizedDrugName: local, brandDrugName: trimmed };
  }

  // Try RxNorm for unlisted drugs
  const rxResult = await rxNormLookup(trimmed);
  if (rxResult && rxResult !== trimmed.toLowerCase()) {
    return { normalizedDrugName: rxResult, brandDrugName: trimmed };
  }

  return { normalizedDrugName: trimmed, brandDrugName: null };
}
