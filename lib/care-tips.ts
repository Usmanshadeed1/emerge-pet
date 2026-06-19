export type Species = "DOG" | "CAT" | "BIRD" | "RABBIT" | "HAMSTER" | "REPTILE" | "FISH" | "OTHER" | "ALL";

export interface CareTip {
  id:          string;
  title:       string;
  category:    string;
  emoji:       string;
  species:     Species[];
  summary:     string;
  content:     string;
}

export const CARE_TIPS: CareTip[] = [
  // ── Dog Tips ─────────────────────────────────────────────────────────────
  {
    id: "dog-dental",
    title: "Brushing Your Dog's Teeth",
    category: "Dental Care",
    emoji: "🦷",
    species: ["DOG"],
    summary: "Daily brushing prevents tartar, gum disease, and bad breath — and it's easier than you think.",
    content: `Dental disease affects over 80% of dogs by age 3, yet it's almost entirely preventable with regular brushing.

**Getting started:**
Use a soft-bristled toothbrush and toothpaste formulated specifically for dogs — never human toothpaste, as xylitol is toxic to dogs.

**Technique:**
Lift the lip and brush in small circular motions along the gumline. Focus on the outer surfaces of the upper back teeth first — these collect the most tartar. Aim for 2 minutes per session.

**Building the habit:**
Start with just touching the lips and gums with your finger, then graduate to a finger brush, then a full toothbrush. Keep sessions short and reward generously. Most dogs accept it within 2–3 weeks.

**Between brushes:**
Dental chews (look for VOHC-approved products), water additives, and dental toys help reduce plaque between sessions.

**Signs to watch:**
Bad breath, yellow/brown buildup, bleeding gums, or difficulty eating all warrant a vet dental exam.`,
  },
  {
    id: "dog-exercise",
    title: "How Much Exercise Does Your Dog Need?",
    category: "Exercise",
    emoji: "🏃",
    species: ["DOG"],
    summary: "Exercise needs vary hugely by breed, age, and health — here's how to find the right amount.",
    content: `Not all dogs need an hour of running every day. Exercise requirements depend on breed, age, size, and health status.

**By breed group:**
- High-energy breeds (Border Collie, Husky, Dalmatian): 1.5–2 hours daily, ideally with off-leash running
- Medium-energy breeds (Labrador, Boxer, Spaniel): 45–90 minutes daily
- Low-energy breeds (Basset Hound, Bulldog, Shih Tzu): 20–40 minutes daily
- Toy breeds: 20–30 minutes, often prefer several short walks

**By age:**
Puppies need short, frequent play sessions — the "5-minute rule" (5 minutes per month of age, twice a day) prevents joint damage. Senior dogs benefit from gentle daily walks with mental stimulation.

**Signs of too little exercise:**
Destructive chewing, barking, hyperactivity, weight gain, and attention-seeking behavior.

**Mental exercise counts too:**
Puzzle feeders, training sessions, and sniff walks (letting your dog explore by scent) tire dogs out as effectively as physical exercise.`,
  },
  {
    id: "dog-nutrition",
    title: "Reading Your Dog's Food Label",
    category: "Nutrition",
    emoji: "🥩",
    species: ["DOG"],
    summary: "The ingredient list tells you far more than the marketing copy on the bag.",
    content: `Dog food marketing is heavily regulated in what it can claim, but labels still require careful reading.

**The ingredient list:**
Ingredients are listed by weight before processing. Look for a named protein source (chicken, beef, salmon) as the first ingredient. "Meat meal" (e.g., chicken meal) is actually more protein-dense than whole meat after moisture loss — it's not a red flag.

**What to avoid:**
- Vague proteins like "meat" or "poultry" without a named source
- Artificial preservatives (BHA, BHT, ethoxyquin)
- Excessive fillers (corn syrup, excessive grain)

**AAFCO statement:**
Look for "complete and balanced" per AAFCO standards, and check whether it was established by feeding trials (preferred) or formulation.

**Life stage:**
Choose a food appropriate to your dog's life stage — puppy, adult, or senior. Large-breed puppies need foods with controlled calcium levels to prevent bone deformities.

**How much to feed:**
The bag guidelines are starting points, not rules. Adjust based on your dog's body condition score — you should be able to feel ribs without pressing hard, with a visible waist from above.`,
  },
  {
    id: "dog-heat",
    title: "Protecting Your Dog from Heatstroke",
    category: "Safety",
    emoji: "☀️",
    species: ["DOG"],
    summary: "Dogs can't sweat — they rely entirely on panting, making them dangerously prone to overheating.",
    content: `Heatstroke is a life-threatening emergency that can develop within minutes.

**High-risk situations:**
- Parked cars (temperature rises 20°F in 10 minutes, even with windows cracked)
- Walking on hot pavement (burns paws and radiates heat)
- Exercising in midday heat
- Brachycephalic breeds (Bulldogs, Pugs) at any elevated temperature

**Warning signs:**
Heavy panting, drooling, red or pale gums, weakness, vomiting, confusion, and collapse.

**Emergency response:**
Move to shade immediately. Apply cool (NOT ice cold) water to paws, inner thighs, armpits, and neck. Use a fan. Offer small sips of cool water. Go to a vet immediately — heatstroke causes internal organ damage even after external temperature normalizes.

**Prevention:**
Walk before 8 AM or after 7 PM in summer. Always carry water. Test pavement with your palm — if you can't hold it for 7 seconds, it's too hot for paws. Never leave a dog in a parked car, even briefly.`,
  },
  {
    id: "dog-separation",
    title: "Managing Separation Anxiety",
    category: "Behavior",
    emoji: "😰",
    species: ["DOG"],
    summary: "Separation anxiety is common and treatable — consistent training makes a huge difference.",
    content: `Separation anxiety is one of the most common behavioral issues in dogs, affecting an estimated 14–20% of the population.

**Signs:**
Destructive behavior, excessive barking/howling, house-soiling, pacing, or attempts to escape — only when alone.

**Mild cases — training approach:**
Practice "departure cues" without actually leaving. Pick up keys, put on shoes, then sit back down. Gradually increase the time you're out of sight, starting with seconds and building up. Never punish your dog on return.

**Management tools:**
- Kong toys stuffed and frozen with kibble or peanut butter
- Calming music or TV (Through a Dog's Ear playlists are researched for this)
- Sniff mats and puzzle feeders before departure
- A worn piece of your clothing in their bed

**Moderate to severe cases:**
Consult your vet. A combination of behavior modification and medication (fluoxetine, clomipramine) has strong evidence for treatment. A certified applied animal behaviorist (CAAB) can build a desensitization plan.

**Important:**
Punishment makes anxiety worse. Ignore minor attention-seeking but reward calm, independent behavior throughout the day.`,
  },
  {
    id: "dog-senior",
    title: "Caring for a Senior Dog",
    category: "Senior Care",
    emoji: "👴",
    species: ["DOG"],
    summary: "Dogs are considered senior at 7+ years (earlier for large breeds) — their needs change significantly.",
    content: `Large breeds age faster — a Great Dane is senior at 5, while a Chihuahua isn't until 10.

**Health monitoring:**
Bi-annual vet visits are recommended for seniors (vs. annual for adults). Bloodwork screens for kidney disease, diabetes, and thyroid issues — all common and manageable when caught early.

**Joint health:**
Arthritis affects most dogs over 8. Signs: stiffness after rest, reluctance to jump, slower on stairs. Orthopedic beds, ramps for furniture/car, and anti-inflammatory medications (prescribed by vet) make a major difference. Joint supplements (fish oil, glucosamine) have some evidence but ask your vet first.

**Diet adjustments:**
Senior-formulated foods often have fewer calories (older dogs need ~20% less) and added joint-supporting ingredients. Watch weight closely — obesity dramatically accelerates joint disease.

**Cognitive changes:**
Canine cognitive dysfunction (dog dementia) is common after 11. Signs: disorientation, changed sleep cycles, staring at walls, house-soiling. Prescription diets, environmental enrichment, and some medications can slow progression.

**End-of-life planning:**
Know the signs of pain (hiding, panting, reluctance to move) and discuss quality-of-life metrics with your vet proactively.`,
  },
  {
    id: "dog-vaccines",
    title: "Essential Dog Vaccinations",
    category: "Preventive Care",
    emoji: "💉",
    species: ["DOG"],
    summary: "Core vaccines protect against fatal diseases — knowing the schedule keeps your dog safe.",
    content: `Vaccines are divided into core (every dog needs them) and non-core (based on lifestyle risk).

**Core vaccines:**
- **Rabies:** Required by law in most states. Puppy series, then 1-year booster, then every 1–3 years depending on vaccine type and local law.
- **DHPP (Distemper/Hepatitis/Parvovirus/Parainfluenza):** Every 3–4 weeks from 6–16 weeks old, then 1 year later, then every 3 years.

**Non-core (discuss with your vet):**
- **Bordetella (kennel cough):** Recommended for dogs in daycare, boarding, or dog parks. Annually or bi-annually.
- **Lyme disease:** For dogs in tick-endemic areas. Annually.
- **Leptospirosis:** For dogs with outdoor/water exposure. Annually.
- **Canine influenza:** For dogs with frequent group exposure.

**Titer testing:**
For adult dogs, titer tests can check existing immunity levels and may allow deferring some boosters — ask your vet.

**Side effects:**
Mild soreness and lethargy for 24–48 hours is normal. Facial swelling, vomiting, or collapse requires immediate vet attention.`,
  },

  // ── Cat Tips ─────────────────────────────────────────────────────────────
  {
    id: "cat-litter",
    title: "Litter Box Best Practices",
    category: "Environment",
    emoji: "🧹",
    species: ["CAT"],
    summary: "The golden rule: one box per cat, plus one extra — placed in quiet, accessible locations.",
    content: `Most litter box problems are caused by the box, not the cat.

**Number and placement:**
The standard recommendation is n+1 boxes (one per cat, plus one extra). Place them in different areas — cats dislike using the same box twice consecutively, and cornering all boxes in one spot leaves no escape from inter-cat conflict.

**Box type:**
Most cats prefer uncovered boxes — covers trap odor and feel claustrophobic. If you use a cover, clean more frequently. Self-cleaning boxes work for some cats but can frighten others.

**Litter preference:**
Unscented, fine-grained clumping clay is preferred by most cats. Scented litters smell pleasant to humans but overwhelming to cats. Conduct a preference test: offer two boxes side-by-side with different litters.

**Cleaning frequency:**
Scoop at least once daily. Full litter change every 1–2 weeks for clumping, 2–3 days for non-clumping. Wash the box itself monthly with mild dish soap.

**Signs of a problem:**
House soiling always warrants a vet visit first to rule out urinary tract infections, which are common and painful. Only after a medical cause is excluded should behavior modification begin.`,
  },
  {
    id: "cat-indoor",
    title: "Enriching an Indoor Cat's Life",
    category: "Mental Health",
    emoji: "🏠",
    species: ["CAT"],
    summary: "Indoor cats live longer but need deliberate environmental enrichment to stay mentally healthy.",
    content: `Indoor cats have a lifespan of 12–18 years vs. 2–5 for outdoor cats — but boredom is a serious welfare issue.

**The five pillars of cat enrichment:**
1. **Vertical space:** Cats feel safe up high. Cat trees, window perches, and wall-mounted shelves let cats survey their territory.
2. **Hiding spots:** Boxes, tunnels, and covered beds give cats a sense of security and control.
3. **Scratching posts:** Cats scratch to mark territory, stretch, and maintain claws. Provide both horizontal and vertical options in prominent locations.
4. **Play:** At minimum, two 10-minute wand toy sessions daily. Simulate prey movement — drag along the floor, hide under fabric, let the cat "catch" it.
5. **Hunting/foraging:** Feed from puzzle feeders, scatter kibble, or hide small meals. This activates natural hunting behavior.

**Window access:**
A bird feeder placed outside a window provides hours of mental stimulation.

**Social interaction:**
If you're away for long hours, consider a second cat, a cat-safe TV channel, or a catio (enclosed outdoor enclosure) for environmental variety.`,
  },
  {
    id: "cat-grooming",
    title: "Grooming Your Cat at Home",
    category: "Grooming",
    emoji: "✨",
    species: ["CAT"],
    summary: "Most cats self-groom, but regular brushing prevents mats, hairballs, and lets you spot health changes.",
    content: `Cats are fastidious self-groomers, but they still benefit from human assistance — especially long-haired breeds.

**Brushing frequency:**
- Short-haired cats: once per week
- Medium-hair cats: 2–3 times per week
- Long-haired cats (Maine Coon, Ragdoll, Persian): daily to prevent mats

**Tools:**
A fine-toothed comb or slicker brush for most coats. A dematting comb for long-haired cats. Never cut mats out — you risk cutting skin. Use detangling spray and work the mat loose from the ends.

**Nail trimming:**
Trim every 2–4 weeks. Use cat-specific clippers. Cut only the clear tip, avoiding the pink quick. If your cat resists, trim one paw per session and reward heavily.

**Ear cleaning:**
Check weekly. A small amount of light brown wax is normal. Dark discharge, odor, or scratching at ears warrants a vet visit (possible ear mites or infection). Clean with a cotton ball and vet-approved ear cleaner — never cotton swabs inside the canal.

**Bathing:**
Rarely needed unless the cat gets into something. Use cat-formulated shampoo in warm water. Wrap in a towel immediately after.`,
  },
  {
    id: "cat-hydration",
    title: "Getting Your Cat to Drink More Water",
    category: "Nutrition",
    emoji: "💧",
    species: ["CAT"],
    summary: "Cats evolved from desert animals and have low thirst drive — chronic dehydration causes kidney and urinary disease.",
    content: `Kidney disease affects an estimated 30–40% of cats over 10 years old, and chronic dehydration is a major contributing factor.

**Why cats don't drink enough:**
Cats evolved to get most hydration from prey. Their thirst mechanism is weak — they can be 3–4% dehydrated before sensing thirst. Dry food provides only 10% moisture vs. 70–80% in wet food.

**Practical strategies:**

**1. Wet food:**
Even replacing one meal per day with wet food significantly increases hydration. Cats on all-wet diets are rarely dehydrated.

**2. Water fountains:**
Running water triggers a hunting instinct — cats are strongly attracted to moving water. A pet fountain increases water intake by 30–50% in most cats.

**3. Water placement:**
Keep water bowls away from food bowls (cats associate water near food with contamination). Place multiple water sources around the home.

**4. Bowl material:**
Many cats dislike plastic (which can harbor bacteria and affect taste). Try stainless steel or ceramic.

**5. Water temperature:**
Some cats prefer slightly cool water — drop in an ice cube in summer.

**Signs of dehydration:**
Lethargy, sunken eyes, dry gums, and skin that "tents" when gently pinched.`,
  },
  {
    id: "cat-vaccines",
    title: "Essential Cat Vaccinations",
    category: "Preventive Care",
    emoji: "💉",
    species: ["CAT"],
    summary: "Core vaccines protect against serious feline diseases — the schedule differs from dogs.",
    content: `Cat vaccinations are divided into core (all cats) and non-core (based on lifestyle).

**Core vaccines:**
- **Rabies:** Required by law in most areas. Initial vaccination, 1-year booster, then every 1–3 years.
- **FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia):** Every 3–4 weeks from 6–16 weeks, then 1 year later, then every 1–3 years. This "feline distemper" vaccine is critical.

**Non-core vaccines:**
- **FeLV (Feline Leukemia Virus):** Strongly recommended for outdoor cats or cats exposed to FeLV-positive cats. Annually.
- **FIV:** Available but with limitations — discuss with your vet.
- **Bordetella (cat):** For cats in boarding or multi-cat households.

**Indoor cats:**
Still need core vaccines — indoor cats can escape, and some viruses (like panleukopenia) can be tracked in on shoes.

**Vaccine-associated sarcoma:**
A rare but real concern in cats. Vaccines are now administered in specific leg locations to allow for treatment if a sarcoma develops. Ask your vet about their injection site protocol.`,
  },

  // ── All Species Tips ─────────────────────────────────────────────────────
  {
    id: "all-dental",
    title: "Why Dental Health Matters for All Pets",
    category: "Dental Care",
    emoji: "🦷",
    species: ["DOG", "CAT", "RABBIT", "BIRD", "HAMSTER", "REPTILE", "FISH", "OTHER", "ALL"],
    summary: "Dental disease is the most common health issue in pets — and almost entirely preventable.",
    content: `Periodontal disease affects 80% of dogs and 70% of cats over age 3. Left untreated, it leads to chronic pain, tooth loss, and bacteria entering the bloodstream — damaging heart, kidney, and liver.

**For dogs and cats:**
Daily brushing is the gold standard. Even every-other-day brushing reduces tartar significantly. Add VOHC-approved dental chews and water additives as supplementary help.

**Professional cleanings:**
Annual dental cleanings under anesthesia remove tartar below the gumline that brushing can't reach. Modern anesthesia is very safe — the risk of NOT cleaning diseased teeth is far greater.

**For rabbits and guinea pigs:**
Dental issues are the most common health problem in rabbits. Their teeth grow continuously — unlimited hay (timothy for adults) keeps teeth worn properly. Malocclusion (misaligned teeth) requires vet attention.

**For birds:**
Birds don't have teeth, but beak overgrowth can occur, especially in cage birds. Provide appropriate chewing materials and have the beak assessed annually.

**Red flags for any pet:**
Bad breath beyond mild odor, drooling, pawing at mouth, dropping food, reluctance to chew, facial swelling, or visible tartar buildup.`,
  },
  {
    id: "all-weight",
    title: "Managing Your Pet's Weight",
    category: "Nutrition",
    emoji: "⚖️",
    species: ["DOG", "CAT", "RABBIT", "BIRD", "HAMSTER", "REPTILE", "FISH", "OTHER", "ALL"],
    summary: "Obesity is the most common preventable disease in pets — it shortens lifespan by 2 years on average.",
    content: `Over 50% of pets in North America are overweight or obese, according to the Association for Pet Obesity Prevention.

**Consequences of obesity:**
Arthritis, diabetes (especially in cats), heart disease, respiratory issues, certain cancers, and reduced lifespan. Obese dogs live on average 1.8 years less than lean dogs.

**Assessing body condition:**
Use the Body Condition Score (BCS) system, a 1–9 scale where 4–5 is ideal. At a healthy weight:
- You can feel (but not see) ribs with light pressure
- There is a visible waist when viewed from above
- The abdomen tucks up when viewed from the side

**Causes of weight gain:**
- Overfeeding (measure portions — most owners underestimate by 25%)
- Too many treats (treats should be ≤10% of daily calories)
- Insufficient exercise
- Medical conditions (hypothyroidism, Cushing's disease)

**Weight loss approach:**
Have your vet calculate a target calorie goal. Weight loss should be gradual — 1–2% body weight per week. Prescription weight-loss diets are more effective than simply cutting portions of regular food (they maintain protein and fiber while cutting calories).`,
  },
  {
    id: "all-parasite",
    title: "Year-Round Parasite Prevention",
    category: "Preventive Care",
    emoji: "🦟",
    species: ["DOG", "CAT", "RABBIT", "BIRD", "HAMSTER", "REPTILE", "FISH", "OTHER", "ALL"],
    summary: "Fleas, ticks, heartworm, and intestinal parasites are preventable — year-round treatment is safer and cheaper than treatment.",
    content: `Parasites cause significant suffering and can be fatal. Prevention costs far less than treatment.

**Fleas:**
One flea becomes 500 in 3 weeks. They cause flea allergy dermatitis (the most common skin disease in pets), tapeworms, and anemia in kittens. Treat ALL pets in the household simultaneously — treating only one pet fails. Monthly topicals, chewables, or collars (e.g., Seresto) are highly effective.

**Ticks:**
Transmit Lyme disease, Ehrlichia, Rocky Mountain Spotted Fever, and more. Check pets after every outdoor trip — remove ticks by grasping close to the skin with fine-tipped tweezers. Monthly oral preventatives (Bravecto, NexGard) work well.

**Heartworm:**
Fatal if untreated. Transmitted by mosquitoes. Prevention (monthly chewable or injection) is simple; treatment is expensive and stressful. Test annually and use year-round prevention even in cold climates — indoor pets are also at risk.

**Intestinal parasites:**
Roundworms, hookworms, whipworms, and Giardia. Many are zoonotic (transmissible to humans, especially children). Annual fecal test recommended. Puppies and kittens need deworming on a schedule.

**Year-round vs. seasonal:**
Year-round is recommended because parasites can survive mild winters, and consistent treatment is more effective than starting and stopping.`,
  },
  {
    id: "all-vet-visits",
    title: "How Often Should Your Pet See a Vet?",
    category: "Preventive Care",
    emoji: "🏥",
    species: ["DOG", "CAT", "RABBIT", "BIRD", "HAMSTER", "REPTILE", "FISH", "OTHER", "ALL"],
    summary: "Preventive care catches disease early when it's most treatable — and often saves money long-term.",
    content: `Preventive care is the most cost-effective investment you can make in your pet's health.

**Recommended schedule:**

**Puppies and kittens (under 1 year):**
Every 3–4 weeks from 6–16 weeks old for vaccines and parasite checks, then at 6 months for spay/neuter, then annually.

**Healthy adult pets (1–7 years):**
Annual wellness exam including physical exam, parasite screening, vaccine review, and dental assessment.

**Senior pets (7+ years, earlier for large breeds):**
Every 6 months. Bloodwork and urinalysis annually to screen for kidney disease, liver disease, thyroid issues, and diabetes — all highly treatable when caught early.

**What happens at a wellness exam:**
Weight and body condition, heart and lung auscultation, lymph node palpation, dental exam, eye and ear check, skin exam, abdominal palpation. More than just vaccines.

**Exotic pets:**
Rabbits, birds, reptiles, and small mammals need exotic-specialist vets. Many conditions are hidden until critical — annual exams are even more important.

**Emergency red flags (see a vet same day):**
Difficulty breathing, collapse, uncontrolled bleeding, seizures, suspected poisoning, inability to urinate, eye injuries, or signs of extreme pain.`,
  },
  {
    id: "all-stress",
    title: "Recognizing and Reducing Pet Stress",
    category: "Mental Health",
    emoji: "😌",
    species: ["DOG", "CAT", "RABBIT", "BIRD", "HAMSTER", "REPTILE", "FISH", "OTHER", "ALL"],
    summary: "Chronic stress suppresses the immune system and shortens lifespan — many stress signals are easy to miss.",
    content: `Stress in pets is often misinterpreted as misbehavior or ignored entirely.

**Common stressors:**
Loud noises (fireworks, thunderstorms), changes in routine, new people or animals, moves, vet visits, long car trips, and insufficient exercise or mental stimulation.

**Stress signals by species:**

**Dogs:** Yawning (when not tired), lip licking, whale eye (showing white of eye), low tail, tucked body, destructive behavior, excessive barking, loss of appetite.

**Cats:** Hiding, over-grooming or under-grooming, inappropriate elimination, aggression, excessive vocalization, reduced appetite, vertical scratching increases.

**Rabbits:** Thumping, hunched posture, teeth grinding, excessive hiding, fur pulling.

**Birds:** Feather plucking, screaming, repetitive behavior, biting, loss of appetite.

**Reducing stress:**
- Predictable routine (same feeding, play, and sleep times)
- Safe hiding spaces for prey animals
- Gradual introduction to new stimuli (counter-conditioning)
- Calming products: Adaptil (dogs), Feliway (cats), compression wraps for noise phobia
- Exercise and mental stimulation as stress outlets

**When to seek help:**
Chronic stress that doesn't resolve with environmental changes warrants a vet consultation — anxiety disorders are real and treatable.`,
  },
  {
    id: "all-poison",
    title: "Common Pet Toxins at Home",
    category: "Safety",
    emoji: "☠️",
    species: ["DOG", "CAT", "RABBIT", "BIRD", "HAMSTER", "REPTILE", "FISH", "OTHER", "ALL"],
    summary: "Many everyday household items are deadly to pets — knowing the list could save your pet's life.",
    content: `Accidental poisoning is one of the most common pet emergencies. The ASPCA Animal Poison Control Center receives over 400,000 calls per year.

**Foods toxic to dogs and cats:**
- Grapes and raisins (kidney failure — even small amounts)
- Xylitol (artificial sweetener in gum, peanut butter, baked goods — causes hypoglycemia and liver failure)
- Chocolate (theobromine toxicity — dark chocolate and baker's chocolate are most dangerous)
- Onions and garlic (Heinz body anemia — affects all alliums)
- Macadamia nuts (dogs — neurological symptoms)
- Alcohol
- Caffeine

**Household products:**
- Rodenticides (rat poison) — often anticoagulants with delayed symptoms
- Antifreeze (ethylene glycol) — sweet taste attracts pets, causes rapid kidney failure
- Many human medications (ibuprofen, acetaminophen, antidepressants)
- Certain plants (lilies — fatal to cats even in tiny amounts; sago palm — fatal to dogs)

**If poisoning is suspected:**
Do NOT induce vomiting unless instructed by a vet. Call ASPCA Poison Control (888-426-4435, fee applies) or your emergency vet immediately. Have the product label ready.

**Prevention:**
Store all medications, cleaning products, and chemicals in locked cabinets. Know what plants are in your home and yard.`,
  },
];

export function getTipsForSpecies(species: string): CareTip[] {
  const s = species.toUpperCase() as Species;
  return CARE_TIPS.filter(
    (tip) => tip.species.includes(s) || tip.species.includes("ALL")
  );
}

export const CATEGORIES = Array.from(new Set(CARE_TIPS.map((t) => t.category)));
