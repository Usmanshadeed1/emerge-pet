# EmergePet App — Full Project Scope & Features

---

## What Is This App?

EmergePet is a pet health management app for pet owners. It works on iPhone, Android, and in a web browser. The goal is simple — keep all your pet's health information in one place, share it instantly in emergencies, and use AI to help when your pet is sick.

---

## Who Uses This App

There are four types of people who interact with this app:

1. Pet Owner — the main user who downloads the app and manages their pets
2. Veterinarian — gets a special access code to view and upload pet records
3. Pet Sitter — gets a temporary link to see pet care instructions while the owner is away
4. EMR Clinic — veterinary hospitals that connect their hospital software to sync records automatically

---

## Feature 1 — User Accounts

The pet owner creates an account to access the app. They can sign up and log in using:
- Email address and password
- Apple Sign In (iPhone users)
- Google Sign In

Once logged in, the owner can update their profile including their name and choose a profile emoji. They can also invite family members to the app by sharing a link.

Family members who accept the invite get access to the same account with the following permissions:
- View all pet profiles and health records
- Add new health records
- Set and check off reminders
- View vet and sitter access links

Family members cannot delete pets or records, cannot manage subscriptions, and cannot generate or revoke vet or sitter access codes. Only the account owner has full control.

**Account Deletion**
The owner can permanently delete their account from the profile settings. This removes all pets, health records, reminders, rewards, and all associated data. A two-step confirmation is shown before deletion is processed. This is a mandatory Apple App Store requirement for any app that allows account creation.

**Onboarding Flow**
New users go through a 5-screen onboarding after signing up for the first time before reaching the main app:
- Screen 1 — Welcome screen introducing the app
- Screen 2 — Pet name and species selection with breed search for dogs and cats
- Screen 3 — Basic details including sex, spayed or neutered status, birthday, weight, and microchip number
- Screen 4 — Pet photo upload
- Screen 5 — First health record — the owner can either request records from their vet or add one manually

The onboarding only appears once per account. After completing it the owner goes directly to the main app on all future logins.

**Newsletter Signup**
New users are automatically added to the app mailing list when they register via email, Google, or Apple. The website also includes a newsletter signup form for visitors who have not yet downloaded the app.

---

## Feature 2 — Pet Profiles

The owner can add as many pets as they want. Each pet has its own profile with the following information:
- Pet name
- Species — dog, cat, bird, rabbit, fish, reptile, hamster, or other
- Breed
- Date of birth and weight
- Color and markings
- Microchip ID number
- Sex — male or female
- Whether the pet is spayed or neutered
- Special notes such as allergies or medical conditions
- A photo of the pet

All pets appear on the home screen in a grid view. The owner can tap any pet to open its full profile. The owner can also edit any pet's details at any time — all fields can be updated including the photo, which can be changed or removed.

---

## Feature 3 — Health Records

This is the most important feature of the app. For each pet, the owner can log and store the following types of health records:

- Vaccinations — the vaccine name, date it was given, the next due date, the vet's name, and the clinic name
- Medications — the drug name, dosage, start date, and notes
- Vet Visits — the date, vet name, clinic, and visit notes
- Lab Results — blood tests, x-rays, and other test results
- Surgeries — the procedure name, date, and recovery notes
- Other — any other health information

In addition to manually entering records, the owner can also:
- Upload a PDF document such as vet discharge papers or medical reports
- The app's AI will automatically read the PDF and extract all records from it, including vaccinations, medications, and reminders, and the owner can choose which ones to import. The owner can also edit any extracted record name before importing it. The AI flags any impossible or suspicious dates such as future vaccine dates or expiry dates before the administration date, shown as warnings in the review screen
- Request records from a clinic — the owner enters the clinic name and email address, the app sends the clinic a secure one-time upload link by email, the clinic uploads the files without needing an account or login, and the owner receives a notification when the upload is complete

**Drug Normalization**
When a medication is logged or extracted from a PDF, brand-name drugs are automatically converted to their generic names. For example Rimadyl becomes carprofen and Apoquel becomes oclacitinib. Both the brand name and generic name are shown so nothing is lost. This ensures consistency across records regardless of how the drug was written on a document.

**Record Source Tracking**
Every health record is tagged with where it came from — entered manually by the owner, extracted from a PDF by the AI, pushed directly by a vet through the portal, or uploaded by a clinic via the secure upload link. This is shown as a color-coded badge on each record so the owner always knows the origin of every piece of information.

The app also shows a core vaccine tracker for each pet. For dogs it tracks Rabies, DH2PPv, Bordetella, and Lyme. For cats it tracks Rabies and FVRCP. Each vaccine shows one of four statuses — Up to Date, Due Soon, Overdue, or No Due Date — based on the next due date entered.

---

## Feature 4 — Reminders

The owner can set reminders for any pet for the following types of events:
- Vet appointments
- Medications — with frequency options including once daily, twice daily, three times daily, every 8 hours, weekly, monthly, or as needed
- Grooming sessions
- Vaccinations
- Any other custom reminder

Each reminder has a title, due date, optional time, and optional notes.

The app shows all reminders in a calendar view. The calendar shows colored dots on each date — red for overdue reminders, purple for vaccination reminders, and teal for all other reminders. The owner can tap any date to see the reminders for that day.

When a reminder is done, the owner checks it off. Checking off a reminder earns 15 reward points.

**Notifications:**
- On the web app, the owner receives email notifications for upcoming reminders
- On the mobile app (Phase 2), the owner receives push notifications for upcoming reminders
- Notification timing is sent one day before and on the day of the reminder

**Weekly AI Health Summary**
Every Monday morning the app automatically emails the owner an AI-generated health summary for each of their pets. The AI reviews the pet's current records, upcoming reminders, and any flagged concerns and writes a plain-English summary. The email is only sent if there is something worth flagging — owners with fully up-to-date pets with no concerns are not emailed unnecessarily.

---

## Feature 5 — AI Symptom Checker

This is a premium feature. The owner describes what is wrong with their pet, and the AI analyzes the symptoms and gives a response in real time.

The owner selects which pet has the symptoms, or can choose General if not specific to one pet. They then type the symptoms in their own words, for example "my dog is limping and not eating since this morning."

The AI responds with one of three urgency levels:

- URGENT — means the pet needs emergency vet care immediately
- MONITOR — means the owner should schedule a vet visit within 24 to 48 hours
- NON-URGENT — means the issue is minor and can be monitored at home

For URGENT cases, the app automatically shows a list of nearby veterinary clinics. Each clinic card shows the clinic name, distance in miles, address, opening hours, a directions button that opens Google Maps, and a call button to phone the clinic directly.

The owner can run as many symptom checks as they want and start a new assessment at any time.

---

## Feature 6 — AI Visit Prep

Before a vet appointment the owner can generate an AI-prepared visit summary for their pet. The AI reads the pet's current records and produces a structured summary organized into clear sections — current concerns, active medications, suggested questions to ask the vet, upcoming care that is due, and any recent lab highlights. This is displayed as clean readable cards rather than raw text. The owner can share this summary directly with their vet before or during the appointment.

---

## Feature 7 — Pet Health Score

This is a premium feature. The app generates an AI-powered health score out of 100 for each pet based on their records and profile data.

The score is shown as a circular ring with a color — green for a good score of 80 or above, orange for a moderate score of 60 to 79, and red for a low score below 60. A letter grade from A to F is also shown.

The score breaks down into 6 specific categories each shown with a progress bar and a status note:

- Vaccination Status — are core vaccines recorded and up to date
- Preventive Care — how often has the pet been seen by a vet in the past 12 months
- Weight and Nutrition — is the pet's weight recorded and appropriate for its species and age
- Medication and Parasite Prevention — are heartworm, flea, and tick prevention records present
- Dental and Grooming — are dental cleanings or grooming records present
- Reminder Compliance — are reminders being completed on time or are they overdue

The app then shows personalized recommendations based on what is missing or needs attention. Recommendations are labeled as Urgent, Soon, or Tip with specific actionable advice for that pet by name.

The owner can regenerate the health score at any time.

---

## Feature 8 — QR Code Emergency Sharing

This is a premium feature. Every pet gets a unique QR code that the owner can print on a collar tag, save to their phone, or share anywhere.

When anyone scans the QR code — a vet, a bystander, an emergency responder — they are taken to a public emergency record page. No login or app is required to view this page.

The emergency page shows:
- A red emergency banner at the top indicating this is read-only emergency information
- The pet's photo or species emoji
- Pet name, species, breed, age, weight, color, and microchip number
- Any special notes such as allergies
- All health records including vaccinations, medications, vet visits, and surgeries

This feature is designed to help in situations where the owner is not present and a stranger or emergency vet needs to know the pet's medical history immediately.

---

## Feature 9 — Vet Portal Access

The owner can give their regular veterinarian access to view and update the pet's records directly in the app.

The owner generates a unique 8-character access code for each vet and shares it with them. The vet visits a special portal link and enters the code. The vet can then:
- View the full pet profile and all health records
- Submit a structured visit note after an appointment — including chief complaint, diagnosis, treatments given, and discharge instructions. This creates a health record directly on the pet's profile and notifies the owner instantly
- Upload additional files such as lab results or imaging reports — no account or login required

Records added by the vet are tagged with a blue badge showing they came from the vet portal, so the owner always knows the source.

The owner can see all linked vets listed in the app and can revoke any vet's access at any time. Each vet gets their own separate code.

---

## Feature 10 — Pet Sitter Access

When the owner goes on vacation or is away, they can generate a temporary access link for their pet sitter.

The owner chooses how long the link is valid — 1 day, 3 days, 7 days, or 30 days. They can also restrict the link to show only specific pets if they have multiple. The link can be given a label such as "Weekend Sitter" to keep things organized.

The sitter opens the link and can see:
- Pet profiles for the allowed pets
- Upcoming reminders including medication schedules
- The most recent health records

The link expires automatically when the duration ends. The owner can also revoke it at any time.

---

## Feature 11 — Pet Care Advisor (AI Chatbot)

This is an AI chatbot built into the app where the owner can ask any question about pet care. The owner selects a pet and then types a question. The AI responds with personalized advice based on the pet's species.

The app shows suggested questions to help the owner get started. For dogs, suggestions include questions about the best food and mental stimulation toys. For cats, suggestions include how to stop furniture scratching and litter recommendations.

The chatbot can also recommend products and includes links to purchase them.

---

## Feature 12 — Care Tips & Breed Care Guide

The app includes a library of 18 static care tips. The tips are filtered by the selected pet's species so dog owners see dog tips, cat owners see cat tips, and so on.

Topics covered include exercise, nutrition, dental care, grooming, mental stimulation, parasite prevention, regular vet checkups, and weight monitoring.

**Breed Care Guide**
In addition to the static tips, each pet has an AI-generated breed-specific care guide. A Golden Retriever owner sees advice specific to that breed — common health risks, ideal diet, exercise needs, grooming frequency, and lifespan expectations — rather than generic dog advice. This is generated by the AI based on the pet's breed and species recorded in their profile.

---

## Feature 13 — Rewards System

This is a premium feature. The app rewards the owner for keeping their pet's health records up to date through a points and badge system.

Points are earned for the following actions:

- Adding a new pet earns 50 points
- Adding a pet photo earns 20 points
- Completing a reminder earns 15 points
- Logging a health record earns 10 points
- Generating a health score earns 10 points
- Using the AI symptom checker earns 10 points
- Analyzing a PDF record earns 10 points
- Setting a new reminder earns 5 points
- Logging in daily earns 5 points

There are five membership tiers based on total points:

- Level 1 — New Member — 0 to 100 points
- Level 2 — Pet Lover — 101 to 300 points
- Level 3 — Dedicated Owner — 301 to 600 points
- Level 4 — Expert Caregiver — 601 to 999 points
- Level 5 — Platinum Pet Parent — 1000 points and above

There are 9 achievements that can be unlocked including First Step, Pet Parent, Record Keeper, On Schedule, AI Explorer, and Platinum Pet Parent. A rewards store is planned for future release where points can be redeemed.

---

## Feature 14 — Subscriptions

The app has a free tier and a premium paid tier. Owners pay a monthly or annual subscription to access premium features.

**Payment handling:**
- RevenueCat manages all subscriptions across web, iOS, and Android from one unified dashboard
- On the web app — RevenueCat uses Stripe under the hood, which supports Apple Pay and Google Pay as payment methods
- On the mobile app (Phase 2) — RevenueCat handles Apple App Store and Google Play subscriptions natively
- The key benefit — if a user subscribes on web, they automatically get premium access on the mobile app as well, and vice versa. One subscription works everywhere with no extra steps

Premium features include the AI symptom checker, QR code emergency sharing, pet health score, and the rewards system.

---

## Feature 15 — EMR Integration (For Veterinary Clinics)

This is a feature for veterinary hospitals that use their own clinic management software. The hospital gets an API key which allows their software to connect directly to the EmergePet system.

Once connected, the hospital software can:
- Look up a pet by microchip number, name, species, or date of birth
- Automatically push health records into the owner's app after a visit

This means when a pet owner visits a participating clinic, the visit notes and records automatically appear in their EmergePet app without the owner needing to do anything.

---

## Free vs Premium Features

Free features available to all users:
- Pet profiles
- Health records
- Reminders and email notifications
- Weekly AI health summary email
- AI visit prep
- Care tips and breed care guide
- Vet portal access
- Pet sitter access
- Pet care advisor chatbot

Premium features requiring a paid subscription:
- AI symptom checker
- QR code emergency sharing
- Pet health score
- Rewards system and achievements

---

## Planned Future Feature — AI Chat History

The app should be designed to save the owner's past AI chats so they can look back at previous symptom checks and pet advice conversations. This is a planned feature for a future release and does not need to be built in the initial version.

---

## Technology Stack

### Phase 1 — Web Application
- **Frontend:** Next.js + Tailwind CSS (TypeScript)
- **Backend:** Next.js API Routes (built into the same project)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** Auth.js — handles email, Google, and Apple login
- **File Storage:** Cloudinary — for pet photos and PDF uploads
- **Payments:** RevenueCat — manages all subscriptions across web and mobile from one dashboard (uses Stripe under the hood for web, supports Apple Pay and Google Pay)
- **AI/LLM:** To be decided per phase — flexible integration
- **Admin Panel:** Built inside Next.js — protected admin routes
- **Email:** Resend — for reminder notifications, clinic upload links, weekly AI summaries, and transactional emails
- **Email Marketing:** Mailchimp — for newsletter and automated user communications

### Phase 2 — Mobile Application
- **Mobile:** React Native + Expo — iOS and Android from one codebase
- **Shared:** Same backend API from Phase 1, no rewrite needed
- **Payments:** RevenueCat — same system as web, handles App Store and Google Play natively
- **Push Notifications:** Expo Push Notifications

---

## Summary

EmergePet is a complete pet health management platform. It covers everything from storing basic pet information to emergency sharing, AI-powered health analysis, vet collaboration, and gamified engagement. The app is designed to work on iPhone, Android, and in any web browser from a single codebase.
