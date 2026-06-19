# EmergePet — Master Development Prompt — WEBSITE (Phase 1 of 2)

> This document is for the **website build only**. The mobile app is a separate document: MASTER_PROMPT_MOBILE.md — to be created after this is complete.

---

## About This Document

This is the master development prompt for the EmergePet website (Project Phase 1). It is written for an LLM developer to follow step by step. Each phase is broken into numbered sub-steps. After every phase, there is a testing checkpoint before moving to the next phase. At any point, you can tell the LLM "we are at Step X.X" and it will understand the full context of where we are in the build.

Do not skip steps. Do not move to the next phase until the current phase test passes. Each step is intentionally small and focused so nothing gets missed.

---

## Project Context

**App Name:** EmergePet
**What It Is:** A pet health management platform for pet owners to store health records, get AI-powered health insights, share emergency pet info via QR code, and collaborate with vets and pet sitters.
**Reference Document:** EMERGEPET_APP.md — read this before starting for full feature details.

---

## Technology Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (same project)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** Auth.js (email, Google, Apple)
- **File Storage:** PostgreSQL database — pet photos and uploaded files stored as base64 strings directly in the database. No third-party file hosting. Files are served via internal API routes.
- **Payments:** RevenueCat (web + mobile)
- **Email (Transactional):** Resend
- **Email (Marketing):** Mailchimp
- **AI/LLM:** Provider-agnostic, configured by the admin via the admin panel. Supports Groq, OpenRouter, Hugging Face, or any OpenAI-compatible API. Admin sets the provider URL, API key, and a list of models. The app rotates through configured models automatically. All AI calls go through a single shared `lib/ai.ts` helper — no SDK is hardcoded. Free-tier providers (Groq, OpenRouter free models) are the default recommendation.
- **Admin Panel:** Built inside Next.js (protected routes) — includes full LLM provider configuration

---

## How To Read This Document

Each step follows this format:

```
Step X.X — [Step Title]
Role: [Frontend Developer | Backend Developer | Full Stack Developer]
Task: [Exactly what to build]
```

After each phase, there is a test block:

```
✅ PHASE X TEST
[List of things to verify before moving on]
```

---

## Ground Rules For The LLM Developer

1. Always use TypeScript — no plain JavaScript files
2. Always use Tailwind CSS for all styling — no custom CSS files unless absolutely necessary
3. Keep API routes in `/app/api/` following Next.js App Router conventions
4. Keep all database operations inside server-side code only — never expose raw DB calls to the client
5. Use Prisma client for all database queries
6. Every API route must handle errors gracefully and return proper HTTP status codes
7. Never hardcode secrets — always use environment variables via `.env.local`
8. After completing each step, confirm it works before moving to the next

## Family Member Permission Rules

Every API route that reads or writes data must check who is making the request — the account owner or an invited family member. Use this rule everywhere:

- **Owner** — full access: read, write, delete, manage subscriptions, generate vet codes, generate sitter links
- **Family Member** — can read all pet data, add health records, set and check off reminders. Cannot delete pets or records, cannot manage subscriptions, cannot generate or revoke vet access codes or sitter links

Create a helper function `lib/permissions.ts` that exports `canWrite(user, action)` and `isOwner(user, petOwnerId)` — use these in every relevant API route instead of duplicating the logic.

---

---

# PHASE 1 — Project Foundation & Setup

> **Goal:** Get the project initialized, database connected, and folder structure established. Nothing visible to users yet — this is the foundation everything else is built on.

---

**Step 1.1**
Role: Full Stack Developer
Task: Initialize a new Next.js 14 project using the App Router with TypeScript enabled. Install and configure Tailwind CSS. Install ESLint with the Next.js recommended config. Confirm the dev server runs with no errors on `http://localhost:3333`. Set the dev port to 3333 by updating the `dev` script in `package.json` to `"next dev -p 3333"`.

---

**Step 1.2**
Role: Full Stack Developer
Task: Set up the project folder structure as follows:
```
/app              → Next.js pages and API routes
/app/api          → All backend API routes
/components       → Reusable UI components
/components/ui    → Base UI elements (buttons, inputs, cards, modals)
/lib              → Utility functions, helpers, constants
/lib/db.ts        → Prisma client singleton
/lib/auth.ts      → Auth.js configuration
/prisma           → Prisma schema and migrations
/types            → Shared TypeScript type definitions
/public           → Static assets
```
Create placeholder index files in each folder so the structure exists.

---

**Step 1.3**
Role: Backend Developer
Task: Install Prisma. Create the full database schema in `prisma/schema.prisma` with the following models and all their fields and relations:

- **User** — id, email, name, profileEmoji, role (OWNER | ADMIN), createdAt, updatedAt
- **FamilyMember** — id, userId (owner), memberId (user), createdAt
- **Pet** — id, ownerId, name, species, breed, dateOfBirth, weight, weightUnit, color, markings, microchipId, sex, isNeutered, specialNotes, photoData (Text, base64 encoded image, nullable), photoMimeType (String, nullable), createdAt, updatedAt (note: store dateOfBirth, never age — age is always calculated from dateOfBirth at runtime)
- **HealthRecord** — id, petId, type (VACCINATION | MEDICATION | VET_VISIT | LAB_RESULT | SURGERY | OTHER), title, date, nextDueDate, vetName, clinicName, dosage, notes, source (MANUAL | AI_EXTRACTED | VET_PUSHED | CLINIC_UPLOADED), normalizedDrugName, brandDrugName, fileData (Text, base64 encoded file, nullable), fileMimeType (String, nullable), fileName (String, nullable), createdAt, updatedAt
- **LlmConfig** — id, provider (String — e.g. "groq" | "openrouter" | "huggingface" | "custom"), baseUrl (String), apiKey (String — stored encrypted), models (Json — array of model name strings), activeModelIndex (Int, default 0), isActive (Boolean, default true), createdAt, updatedAt
- **Vaccine** — id, petId, name, administeredDate, nextDueDate, vetName, clinicName, status (UP_TO_DATE | DUE_SOON | OVERDUE | NO_DUE_DATE), createdAt
- **Reminder** — id, petId, title, type (VET_APPOINTMENT | MEDICATION | GROOMING | VACCINATION | CUSTOM), dueDate, dueTime, frequency, notes, isCompleted, completedAt, createdAt, updatedAt
- **VetAccess** — id, petId, accessCode, vetName, vetEmail, isActive, createdAt, revokedAt
- **VetVisitNote** — id, vetAccessId, petId, chiefComplaint, diagnosis, treatments, dischargeInstructions, createdAt
- **SitterAccess** — id, ownerId, label, token, expiresAt, petIds (array), isActive, createdAt, revokedAt
- **RecordRequest** — id, petId, clinicName, clinicEmail, uploadToken, isUploaded, uploadedAt, createdAt
- **RewardPoints** — id, userId, totalPoints, tier, createdAt, updatedAt
- **Achievement** — id, userId, badge, unlockedAt
- **PointTransaction** — id, userId, action, points, createdAt
- **Subscription** — id, userId, revenueCatId, plan (MONTHLY | ANNUAL), status (ACTIVE | CANCELLED | EXPIRED), currentPeriodEnd, createdAt, updatedAt
- **AiChatHistory** — id, userId, petId, messages (Json), type (SYMPTOM_CHECK | PET_ADVISOR), createdAt (reserved for future use — create the model now, do not connect to UI)

Run `prisma migrate dev --name init` to create the database. Confirm all tables are created.

---

**Step 1.4**
Role: Backend Developer
Task: Create a `.env.local` file with placeholder keys for every environment variable the project will need:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
RESEND_API_KEY=
MAILCHIMP_API_KEY=
MAILCHIMP_AUDIENCE_ID=
REVENUECAT_API_KEY=
GOOGLE_PLACES_API_KEY=
CRON_SECRET=
```
Note: AI/LLM credentials (provider URL, API key, model list) are NOT stored in .env.local — they are configured by the admin via the admin panel and stored in the LlmConfig database table. This allows switching providers without redeploying.
Create a `lib/db.ts` file that exports a Prisma client singleton (prevents multiple instances in development).

---

**Step 1.5**
Role: Full Stack Developer
Task: Create a global layout in `app/layout.tsx` with the following:
- HTML document structure with language set to English
- Tailwind base styles applied
- A `<Providers>` wrapper component (in `/components/Providers.tsx`) that wraps the app — this will hold Auth.js session provider and any future global providers
- A placeholder home page at `app/page.tsx` that renders "EmergePet — Coming Soon" centered on screen, styled with Tailwind

---

## ✅ PHASE 1 TEST

Before moving to Phase 2, verify all of the following:

- [ ] `npm run dev` starts with zero errors
- [ ] `http://localhost:3333` loads and shows the placeholder page
- [ ] `npx prisma studio` opens and shows all database tables with correct columns
- [ ] `.env.local` exists with all placeholder keys
- [ ] Folder structure matches the spec in Step 1.2
- [ ] TypeScript compiles with zero type errors (`npx tsc --noEmit`)

---

---

# PHASE 2 — Authentication

> **Goal:** Build the complete login and signup system. Users can create an account and log in with email, Google, or Apple. Protected routes redirect unauthenticated users to login.

---

**Step 2.1**
Role: Backend Developer
Task: Install and configure Auth.js (next-auth v5). Set up the auth config in `lib/auth.ts` with:
- Credentials provider (email + password with bcrypt hashing)
- Google OAuth provider
- Apple OAuth provider
- Prisma adapter to store sessions and users in the database
- Session strategy set to database
- Callbacks to include user id and role in the session object

Create the catch-all Auth.js API route at `app/api/auth/[...nextauth]/route.ts`.

---

**Step 2.2**
Role: Frontend Developer
Task: Build the Login page at `app/(auth)/login/page.tsx` with:
- Email and password input fields
- Submit button
- Error message display for wrong credentials
- Link to the signup page
- Google Sign In button
- Apple Sign In button
- Clean, centered card layout using Tailwind — use green as the primary brand color

---

**Step 2.3**
Role: Full Stack Developer
Task: Build the Signup page at `app/(auth)/signup/page.tsx` with:
- Name, email, and password fields
- Password confirmation field
- Submit button with loading state
- Error handling for duplicate emails
- On success, redirect to the onboarding flow (not dashboard — onboarding comes first for new users)
- Google and Apple signup buttons (same buttons as login, Auth.js handles both)

Create the signup API route at `app/api/auth/register/route.ts` that creates the user in the database with a hashed password.

---

**Step 2.4**
Role: Backend Developer
Task: Create a middleware file at `middleware.ts` in the project root that:
- Protects all routes under `/dashboard`, `/pets`, `/reminders`, `/admin`, and `/api` (except public API routes)
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/signup` to `/dashboard`
- Allows public access to `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password/:token`, `/emergency/:id` (QR code page), `/records/upload/:token` (clinic upload page), `/vet-portal`, and `/sitter/:token` (pet sitter view page)

---

**Step 2.5**
Role: Backend Developer
Task: Create a `lib/session.ts` helper that exports a `getSession()` function for use in server components and API routes to get the current authenticated user. Also create a `requireAuth()` function that throws if the user is not authenticated — to be used inside API routes.

---

**Step 2.6**
Role: Full Stack Developer
Task: Build the forgot password and password reset flow:
- Add a "Forgot Password?" link on the login page
- Build the forgot password page at `app/(auth)/forgot-password/page.tsx` — user enters their email and submits
- Create `app/api/auth/forgot-password/route.ts` — generates a secure time-limited reset token (expires in 1 hour), saves it on the user record, sends a password reset email via Resend with a link to `/reset-password/:token`
- Add `passwordResetToken` and `passwordResetExpiry` fields to the User model in Prisma — run migration
- Build the reset password page at `app/(auth)/reset-password/[token]/page.tsx` — validates the token, shows a new password + confirm password form
- Create `app/api/auth/reset-password/route.ts` — validates the token is valid and not expired, hashes the new password, saves it, and clears the token
- On success, redirect the user to `/login` with a success message
- Rate limit the forgot-password endpoint to 3 requests per hour per email

---

## ✅ PHASE 2 TEST

- [ ] A new user can sign up with email and password — account appears in database
- [ ] Existing user can log in with correct credentials
- [ ] Wrong password shows an error message — does not crash
- [ ] Google Sign In button initiates OAuth flow
- [ ] Apple Sign In button initiates OAuth flow
- [ ] Visiting `/dashboard` while logged out redirects to `/login`
- [ ] Visiting `/login` while already logged in redirects to `/dashboard`
- [ ] "Forgot Password?" link opens the forgot password page
- [ ] Submitting an email sends a reset link via email
- [ ] Reset link opens the new password form — password is updated on submit
- [ ] Expired or invalid reset token shows a clear error message
- [ ] After reset, user can log in with the new password

---

---

# PHASE 3 — Onboarding & User Profile

> **Goal:** New users go through a 5-screen onboarding flow. Returning users skip it. Users can manage their profile and delete their account.

---

**Step 3.1**
Role: Backend Developer
Task: Add an `onboardingCompleted` boolean field (default false) to the User model in Prisma. Run migration. Update the middleware so that authenticated users who have not completed onboarding are always redirected to `/onboarding` — except when they are already on `/onboarding`.

---

**Step 3.2**
Role: Frontend Developer
Task: Build the 5-screen onboarding flow at `app/onboarding/page.tsx` using a step-based state machine (useState for current step). Each screen:

- **Screen 1 — Welcome:** App logo, headline "Your pet's health, all in one place", subtitle, and a "Get Started" button
- **Screen 2 — Pet Name & Species:** Large text input for pet name. Grid of 9 species cards (dog, cat, bird, rabbit, fish, reptile, hamster, other). Breed search input that appears for dogs and cats with a full searchable breed list.
- **Screen 3 — Basic Details:** Sex toggle (Male / Female). Spayed or neutered toggle. Birthday input (exact or approximate). Weight input with lbs/kg toggle. Microchip number input (optional).
- **Screen 4 — Pet Photo:** Circular photo upload area. "Upload Photo" button. Optional — skip button.
- **Screen 5 — First Record:** Two option cards — "Request records from my vet" and "Add a record manually." Either option completes onboarding.

Include a progress bar showing which screen the user is on. Include a Back button on all screens except Screen 1.

---

**Step 3.3**
Role: Backend Developer
Task: Create the onboarding completion API at `app/api/onboarding/complete/route.ts`. When called, it:
- Creates the pet in the database with all fields from the onboarding form
- If a photo was provided, saves it as base64 in the `photoData` and `photoMimeType` fields on the pet record
- Sets `onboardingCompleted = true` on the user
- Returns the new pet id

On successful completion, redirect the user to `/dashboard`.

---

**Step 3.4**
Role: Full Stack Developer
Task: Build the user profile settings page at `app/dashboard/settings/page.tsx` with:
- Display name input (pre-filled from database)
- Profile emoji picker (grid of emoji options)
- Save button with success confirmation
- Family member invite section — a "Copy Invite Link" button that generates a shareable link
- Account deletion section at the bottom with a red "Delete Account" button

Create the profile update API at `app/api/user/profile/route.ts` (PATCH method).

---

**Step 3.5**
Role: Backend Developer
Task: Build the account deletion flow:
- Create `app/api/user/account/route.ts` (DELETE method)
- The endpoint deletes all associated pets, health records, reminders, rewards, vet access codes, sitter links, and finally the user record — in the correct order to respect database foreign key constraints
- The deletion is irreversible
- On the frontend (settings page), the delete button opens a confirmation modal with the text "Type DELETE to confirm" — the input must match exactly before the confirm button activates
- On success, the user is signed out and redirected to the home page

---

**Step 3.6**
Role: Backend Developer
Task: Set up Mailchimp auto-subscribe. In the registration API route (Step 2.3), after successfully creating the user, make a fire-and-forget call to the Mailchimp API to add the user's email to the audience list with the tag `app-user`. Read the Mailchimp API key and audience ID from the `AppSettings` table (configured in Phase 8). If no Mailchimp settings are configured yet, skip silently. This must never block or fail the registration — wrap in try/catch and ignore errors.

---

**Step 3.7**
Role: Full Stack Developer
Task: Build the family member invite acceptance flow:
- In Step 3.4, the "Copy Invite Link" button generates a link to `/invite/[token]`. Build that full flow now:
- Create `app/api/user/invite/route.ts` (POST) — generates a secure unique token, saves it to a new `FamilyInvite` model (id, ownerId, token, email optional, expiresAt 7 days, usedAt nullable, createdAt), returns the shareable link `/invite/[token]`
- Add `FamilyInvite` model to the Prisma schema and run migration
- Build the invite acceptance page at `app/invite/[token]/page.tsx` — public page:
  - Validates the token exists, is not expired, and has not been used
  - Shows the owner's name and a "Join as Family Member" button
  - If the visitor is not logged in, redirects to `/signup?invite=[token]` or `/login?invite=[token]` — the token is preserved through auth
  - After login or signup, the token is consumed: creates a `FamilyMember` record linking the new member to the owner, marks the invite as used
  - On success, redirects the family member to `/dashboard` with a welcome message
  - On invalid/expired token, shows a clear error page

---

## ✅ PHASE 3 TEST

- [ ] New user after signup is redirected to `/onboarding`
- [ ] All 5 onboarding screens render and navigate forward and back correctly
- [ ] Completing onboarding creates the pet in the database and redirects to dashboard
- [ ] Returning user (onboardingCompleted = true) goes directly to dashboard
- [ ] Profile name and emoji can be updated and saved
- [ ] Account deletion modal requires typing "DELETE" before proceeding
- [ ] Account deletion removes all user data from the database
- [ ] New user email appears in Mailchimp audience after signup (when Mailchimp is configured in admin)
- [ ] Owner copies invite link — family member opens it — joins account successfully
- [ ] Family member can view pets and records but cannot delete or manage subscriptions
- [ ] Expired or already-used invite link shows a clear error

---

---

# PHASE 4 — Pet Profiles

> **Goal:** Owners can view all their pets on the dashboard, add new pets, view individual pet profiles, and edit or delete pets at any time.

---

**Step 4.1**
Role: Backend Developer
Task: Create the pets CRUD API routes:
- `GET /api/pets` — returns all pets for the authenticated user
- `POST /api/pets` — creates a new pet
- `GET /api/pets/:id` — returns a single pet (owner only)
- `PATCH /api/pets/:id` — updates a pet
- `DELETE /api/pets/:id` — deletes a pet and all its records

All routes must verify the requesting user owns the pet before allowing access.

---

**Step 4.2**
Role: Frontend Developer
Task: Build the main dashboard at `app/dashboard/page.tsx` with:
- A top header with the EmergePet logo, user profile emoji, and a settings icon
- A pet grid showing all pets as cards — each card shows the pet photo (or species emoji if no photo), pet name, species, and age
- An "Add Pet" card at the end of the grid with a plus icon
- If the user has no pets, show an empty state illustration with "Add your first pet" call to action

---

**Step 4.3**
Role: Frontend Developer
Task: Build the Add Pet form as a modal or a page at `app/dashboard/pets/new/page.tsx` with all pet profile fields:
- Pet name (required)
- Species selector (required) — same 9-species grid as onboarding
- Breed (text input, searchable for dogs and cats)
- Birthday (date picker)
- Weight with lbs/kg toggle
- Color and markings
- Microchip ID
- Sex toggle
- Spayed/neutered toggle
- Special notes (allergies, conditions)
- Photo upload

Include form validation. On submit, call `POST /api/pets`. On success, return to dashboard.

---

**Step 4.4**
Role: Frontend Developer
Task: Build the pet detail page at `app/dashboard/pets/[id]/page.tsx` with:
- Pet photo or species emoji displayed prominently
- All pet profile fields displayed in a clean card layout
- An Edit button that opens the edit form pre-filled with current values
- A Delete button that opens a confirmation modal before deleting
- Tab navigation at the bottom for: Health Records, Reminders, AI Tools, QR Code (tabs built in this step, content added in later phases)

---

**Step 4.5**
Role: Full Stack Developer
Task: Implement pet photo upload using database storage — no third-party file hosting:
- Create `app/api/upload/image/route.ts` — a POST endpoint that accepts an image file (JPG, PNG, WebP, max 2MB), converts it to a base64 string, and returns the base64 string and mime type directly. The caller saves these to the pet record.
- On the Add Pet and Edit Pet forms, allow the user to select an image file — show a preview using a local object URL before saving
- On form submission, convert the selected image to base64 on the client side using FileReader, then save `photoData` and `photoMimeType` fields on the pet record via the pets API
- Create `app/api/pets/[id]/photo/route.ts` — a GET endpoint that reads `photoData` and `photoMimeType` from the database and returns the image with the correct Content-Type header. This URL is used as the `src` for all pet photo `<img>` tags.
- Enforce a 2MB size limit and only allow image MIME types — return a clear error for anything else

---

## ✅ PHASE 4 TEST

- [ ] Dashboard shows pet grid with all user pets
- [ ] "Add Pet" opens the form — all fields are present and functional
- [ ] New pet is saved to database and appears on dashboard
- [ ] Clicking a pet opens the detail page with correct data
- [ ] Edit form loads with pre-filled data — changes save correctly
- [ ] Delete removes the pet and returns to dashboard
- [ ] Pet photo uploads to Cloudinary — URL saved in database — photo displays on pet card and detail page
- [ ] A user cannot access another user's pet by changing the ID in the URL

---

---

# PHASE 5 — Health Records

> **Goal:** The core feature. Owners can log all types of health records manually, upload PDFs for AI extraction, request records from clinics, and see all records with source badges.

---

**Step 5.1**
Role: Backend Developer
Task: Create health records CRUD API routes:
- `GET /api/pets/:id/records` — returns all records for a pet, grouped by type
- `POST /api/pets/:id/records` — creates a new record (with source = MANUAL)
- `PATCH /api/pets/:id/records/:recordId` — updates a record
- `DELETE /api/pets/:id/records/:recordId` — deletes a record

All routes verify pet ownership.

---

**Step 5.2**
Role: Frontend Developer
Task: Build the Health Records tab on the pet detail page. Show records grouped by type with section headers (Vaccinations, Medications, Vet Visits, Lab Results, Surgeries, Other). Each record shows as a card with its title, date, and a source badge (color-coded: grey for manual, amber for AI extracted, blue for vet pushed, green for clinic uploaded). Include an "Add Record" button that opens a modal to select the record type and fill in the relevant fields for that type.

---

**Step 5.3**
Role: Frontend Developer
Task: Build the core vaccine tracker section on the pet detail page. Above the health records list, show a vaccine status row for each core vaccine:
- Dogs: Rabies, DH2PPv, Bordetella, Lyme
- Cats: Rabies, FVRCP

Each vaccine shows a status pill — green for Up to Date, yellow for Due Soon (within 30 days), red for Overdue, grey for No Due Date. Status is calculated from the nextDueDate field on the matching vaccination record.

---

**Step 5.4**
Role: Full Stack Developer
Task: Build PDF upload for health records using database storage:
- Add a "Upload PDF" button on the health records page
- The user selects a PDF file (max 5MB) — it is read client-side and sent as a base64 string to the API
- Create `app/api/pets/[id]/records/pdf/route.ts` — accepts the base64 PDF string, decodes it to a Buffer, uses the `pdf-parse` library to extract the text content, validates the text is readable (minimum 50 characters of meaningful text), then sends the extracted text to the AI for record extraction
- The raw PDF base64 is stored on the resulting HealthRecord's `fileData` and `fileMimeType` fields so the original file is preserved and downloadable later
- Create `app/api/records/[recordId]/file/route.ts` — a GET endpoint that serves the stored file bytes with the correct Content-Type header so the owner can download/view the original PDF
- If the PDF is unreadable (too short, password protected, too many non-text characters), return a clear error message without sending to AI

---

**Step 5.5**
Role: Backend Developer
Task: Build the AI PDF extraction pipeline:
- In `app/api/pets/:id/records/pdf/route.ts`, after validating the PDF, send its text content to the AI with a structured prompt instructing it to extract all health records, vaccinations, medications, and reminders
- The AI must return a structured JSON array of extracted records
- Flag any suspicious dates (future vaccination dates, expiry before administration date) with a warning flag on the record object
- Return the extracted records array to the frontend — do not save to database yet

---

**Step 5.6**
Role: Frontend Developer
Task: Build the AI extraction review UI:
- After PDF extraction, show a review modal listing all extracted records
- Each record has a checkbox (checked by default), an editable name field (pencil icon to edit), and shows any date warnings as amber warning icons with a message
- An "Import Selected" button saves only the checked records to the database with source = AI_EXTRACTED
- A "Cancel" button discards everything

---

**Step 5.7**
Role: Backend Developer
Task: Build drug normalization:
- In `app/api/pets/:id/records/route.ts` (POST and PATCH), when saving a medication record, check if the drug name matches a known brand name from a hardcoded map of 30+ common pet drugs (Rimadyl → carprofen, Apoquel → oclacitinib, Cerenia → maropitant, etc.)
- If a match is found, save both the brand name and the generic name on the record
- If no match in the local map, make a call to the RxNorm API as a fallback
- The UI displays both names: "carprofen (Rimadyl)" format

---

**Step 5.8**
Role: Full Stack Developer
Task: Build the clinic record request flow:
- On the health records page, add a "Request from Clinic" button
- Opens a modal where the owner enters the clinic name and clinic email address
- On submit, call `POST /api/record-requests` which:
  - Creates a RecordRequest record in the database with a unique secure upload token
  - Sends an email via Resend to the clinic email with a link to `/records/upload/:token`
  - Returns success to the frontend

---

**Step 5.9**
Role: Full Stack Developer
Task: Build the clinic upload page at `app/records/upload/[token]/page.tsx`:
- This is a public page — no login required
- Validate the token exists in the database and has not been used
- Show the clinic a simple drag-and-drop file upload area
- On file upload, save the file to Cloudinary, create health records tagged with source = CLINIC_UPLOADED, and mark the RecordRequest as uploaded
- Send the owner an email notification via Resend that records have been uploaded
- Show the clinic a success confirmation

---

## ✅ PHASE 5 TEST

- [ ] Manual records can be added for all 6 types — all fields save correctly
- [ ] Records display grouped by type with correct source badges
- [ ] Vaccine tracker shows correct status for each core vaccine based on due dates
- [ ] Uploading a valid PDF triggers AI extraction — extracted records appear in review UI
- [ ] Uploading a corrupt or unreadable PDF shows an error — does not call AI
- [ ] Date warnings appear on extracted records with impossible dates
- [ ] Editing an extracted record name works before import
- [ ] Only checked records are imported — saved with source = AI_EXTRACTED
- [ ] Brand-name drug is normalized — both names shown in record
- [ ] "Request from Clinic" sends an email to the clinic with the upload link
- [ ] Clinic visits the upload link, uploads a file — record appears in owner's app with source = CLINIC_UPLOADED
- [ ] An expired or invalid upload token shows an error page

---

---

# PHASE 6 — Reminders

> **Goal:** Owners can set reminders for all health events, view them in a calendar, check them off, and receive email notifications.

---

**Step 6.1**
Role: Backend Developer
Task: Create reminders CRUD API routes:
- `GET /api/pets/:id/reminders` — returns all reminders for a pet
- `GET /api/reminders` — returns all reminders across all user's pets (for calendar view)
- `POST /api/pets/:id/reminders` — creates a new reminder. On creation, award 5 points to the user (trigger points engine from Phase 15 — create a stub function now)
- `PATCH /api/pets/:id/reminders/:reminderId` — updates a reminder. If `isCompleted` is set to true, award 15 points
- `DELETE /api/pets/:id/reminders/:reminderId` — deletes a reminder

---

**Step 6.2**
Role: Frontend Developer
Task: Build the Reminders page at `app/dashboard/reminders/page.tsx` with:
- A month calendar view showing all reminders as colored dots on each date — red for overdue, purple for vaccinations, teal for all others
- Clicking a date shows a panel with reminders for that day
- Each reminder card shows the title, pet name, type icon, and a checkbox to mark complete
- An "Add Reminder" button opens a form modal

---

**Step 6.3**
Role: Frontend Developer
Task: Build the Add/Edit Reminder modal with fields:
- Title (required)
- Reminder type selector (Vet Appointment, Medication, Grooming, Vaccination, Custom)
- Pet selector (dropdown of user's pets)
- Due date (date picker)
- Due time (time picker, optional)
- Frequency selector for medications (Once Daily, Twice Daily, Three Times Daily, Every 8 Hours, Weekly, Monthly, As Needed)
- Notes (optional textarea)

---

**Step 6.4**
Role: Backend Developer
Task: Build email notifications for reminders using Resend:
- Create a scheduled function (Next.js cron route or a standalone script) that runs once daily
- Query all reminders where `dueDate` equals tomorrow or today, `isCompleted` is false
- For each, send an email to the pet owner via Resend with the reminder title, pet name, and due date
- Create the cron route at `app/api/cron/reminders/route.ts` — protected by a secret header so only the scheduler can call it

---

**Step 6.5**
Role: Backend Developer
Task: Build the weekly AI health summary email:
- Create a cron route at `app/api/cron/weekly-summary/route.ts`
- Runs every Monday morning
- For each user with pets, fetch all pet records and upcoming reminders
- Send to the AI with a prompt: "Analyze this pet's records and reminders. If there are any concerns, overdue items, or actions the owner should take, write a short plain-English summary. If everything is fully up to date, return null."
- If the AI returns null, do not send an email for that pet
- If the AI returns a summary, send a formatted email via Resend to the owner

---

## ✅ PHASE 6 TEST

- [ ] Reminders can be added for all types with all fields
- [ ] Calendar shows colored dots on correct dates
- [ ] Clicking a date shows the reminders for that day
- [ ] Checking off a reminder marks it complete in the database
- [ ] Overdue reminders show in red
- [ ] Reminder notification email is sent for reminders due today and tomorrow
- [ ] Weekly summary cron runs and sends an email when concerns exist — skips email when all is fine

---

---

# PHASE 7 — Care Tips & Breed Care Guide

> **Goal:** Owners see a library of care tips filtered to their pet's species and an AI-generated breed-specific care guide.

---

**Step 7.1**
Role: Frontend Developer
Task: Build the Care Tips page at `app/dashboard/care-tips/page.tsx`:
- Show a grid of 18 tip cards
- Each card has a title, category icon, and a short description
- Add a pet selector at the top — when a pet is selected, filter tips to show only those relevant to that pet's species
- Clicking a tip card expands it to show the full tip content
- Store the 18 tip articles as static content in `lib/care-tips.ts` — no database needed

---

**Step 7.2**
Role: Full Stack Developer
Task: Build the Breed Care Guide:
- On the individual pet detail page, add a "Breed Care Guide" tab
- Create `app/api/pets/:id/breed-guide/route.ts` — sends the pet's breed and species to the AI with a prompt to return a structured guide covering: common health risks, ideal diet, exercise needs, grooming frequency, and lifespan expectations
- Cache the result in the database (add a `breedGuideContent` and `breedGuideGeneratedAt` field to the Pet model) so it is not regenerated on every visit — only regenerate if the breed changes or if the content is older than 30 days
- Display the guide as clean section cards on the pet page

---

## ✅ PHASE 7 TEST

- [ ] All 18 care tips display on the care tips page
- [ ] Selecting a dog pet shows only dog tips — cat pet shows cat tips
- [ ] Clicking a tip expands it with full content
- [ ] Breed Care Guide generates for a dog or cat and displays in organized sections
- [ ] Visiting the breed guide again within 30 days uses the cached version (no new AI call)

---

---

# PHASE 8 — Admin Panel & Dynamic App Settings

> **Goal:** Build the admin panel and a dynamic settings system so all external service credentials (AI provider, email, payments, maps, marketing) are stored in the database and managed via the admin UI — not hardcoded anywhere. This phase must be completed before any AI feature is built.

---

**Step 8.1**
Role: Backend Developer
Task: Create admin access control:
- The `ADMIN` role already exists on the User model. Create `lib/admin.ts` — exports `requireAdmin(session)` which throws a 403 if the user's role is not ADMIN
- Apply to all `/api/admin/*` routes and `/admin/*` pages
- Add `/admin` to the public/protected route list in middleware so it redirects non-admins correctly
- Add `SETUP_SECRET` to `.env.local` — a strong passphrase chosen by the developer
- Build a one-time admin bootstrap page at `app/admin/setup/page.tsx` and API at `app/api/admin/setup/route.ts`:
  - The GET endpoint returns `{ available: true }` when zero admins exist, `{ available: false }` otherwise
  - The POST endpoint accepts `{ secret }`, validates it against `SETUP_SECRET` env var, verifies zero admins exist, and promotes the currently signed-in user to ADMIN
  - The page shows a password input for the secret. On success, redirects to `/admin`. After one admin exists, the page permanently shows "Setup complete" and rejects all POST requests (HTTP 410)
  - Middleware allows `/admin/setup` and `/api/admin/setup` for authenticated non-admin users so they can reach the page after signing up
- Build promote/demote admin feature in the Admin Users page:
  - Each user row has a "Make Admin" button (shown for OWNER users) and a "Remove Admin" button (shown for other ADMIN users)
  - The `PATCH /api/admin/users/[id]` route accepts `{ role: "ADMIN" | "OWNER" }` in addition to `{ isActive }`
  - An admin cannot modify their own account via this route
  - Active/deactivate toggle is hidden for admin users (admins cannot be deactivated)

---

**Step 8.2**
Role: Backend Developer
Task: Create the `AppSettings` database model and settings helper, and update the `LlmConfig` model to support multiple independent provider entries:
- Add `AppSettings` model to Prisma schema: id, key (String, unique), value (String), isEncrypted (Boolean, default false), updatedAt
- Update the existing `LlmConfig` model so each record represents one complete provider configuration: id, label (String — display name the admin sets), provider (String — "openai" | "groq" | "gemini" | "huggingface" | "openrouter" | "custom"), baseUrl (String), apiKey (String — encrypted at rest), model (String — single model name, not an array), isActive (Boolean, default true), createdAt, updatedAt
- Run migration
- Create `lib/settings.ts` — exports `getSetting(key): Promise<string | null>` and `setSetting(key, value, encrypted?: boolean): Promise<void>`. Sensitive values (API keys) are encrypted at rest using AES-256 with a key derived from `NEXTAUTH_SECRET`
- The following AppSettings keys are used throughout the app: `llm_active_index` (tracks rotation position across LlmConfig records), `email_provider` ("resend" | "smtp" — which email system is active), `resend_api_key`, `resend_from_email`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_password` (encrypted), `smtp_tls` ("true"/"false"), `smtp_from_email`, `revenuecat_api_key`, `google_places_key`, `mailchimp_api_key`, `mailchimp_audience_id`, and AI prompt keys: `prompt_symptom_check`, `prompt_breed_guide`, `prompt_health_score`, `prompt_visit_prep`, `prompt_advisor`, `prompt_weekly_summary`

---

**Step 8.3**
Role: Backend Developer
Task: Build `lib/ai.ts` — the single shared function all AI features use from Phase 9 onward:
- Export `callAI(messages: {role: string, content: string}[], options?: {jsonMode?: boolean}): Promise<string>`
- Fetches all `LlmConfig` records where `isActive = true`, ordered by `createdAt`
- Reads `llm_active_index` from `AppSettings` to determine which provider to use next — increments it (wrapping around) after each call
- Makes a native `fetch` POST to `{config.baseUrl}/chat/completions` using the selected config's `apiKey` and `model`
- Sets `Authorization: Bearer {apiKey}` header
- If `jsonMode` is true, adds `response_format: {type: "json_object"}` to the request body
- If no active LlmConfig records exist, throws an error: `"No AI provider configured — add one in Admin > App Settings"`
- No SDK packages — native fetch only
- Create `lib/prompts.ts` — exports default system prompt strings as named constants for every AI feature (PROMPT_SYMPTOM_CHECK, PROMPT_BREED_GUIDE, PROMPT_HEALTH_SCORE, PROMPT_VISIT_PREP, PROMPT_ADVISOR, PROMPT_WEEKLY_SUMMARY). Each AI feature reads its prompt from `AppSettings` first via `getSetting("prompt_*")` and falls back to the constant in `lib/prompts.ts` if not set. This lets admins override any prompt without redeploying.

---

**Step 8.4**
Role: Full Stack Developer
Task: Build the admin layout and navigation:
- `app/admin/layout.tsx` — sidebar with links: Analytics, Users, Subscriptions, EMR Keys, App Settings
- Each sidebar link is active-highlighted for the current page
- A "Back to App" link at the top of the sidebar
- The layout uses `requireAdmin` to block non-admins at the layout level

---

**Step 8.5**
Role: Full Stack Developer
Task: Build the Admin Analytics page at `app/admin/page.tsx` with stat cards:
- Total registered users
- Total pets
- Total health records
- Active premium subscriptions
- New users this week
- Total reminders set

---

**Step 8.6**
Role: Full Stack Developer
Task: Build the Admin Users page at `app/admin/users/page.tsx`:
- Searchable table: name, email, role, pet count, subscription status, joined date
- Click a row to expand and see the user's pets list
- Deactivate / reactivate user toggle (sets a `isActive` boolean on User — add to schema, run migration)
- Deactivated users cannot log in — middleware checks this flag

---

**Step 8.7**
Role: Full Stack Developer
Task: Build the Admin Subscriptions page at `app/admin/subscriptions/page.tsx`:
- Table: user email, plan (Monthly/Annual), status, renewal date
- Filter tabs: All, Active, Cancelled, Expired
- Total active count and estimated monthly revenue shown at top

---

**Step 8.8**
Role: Full Stack Developer
Task: Build the Admin EMR Keys page at `app/admin/emr/page.tsx`:
- Table: clinic name, key (masked after creation), created date, last used, status
- "Generate New Key" button — generates a secure random key, shows it once in a copy modal (store only the hashed version — never the raw key)
- Revoke button per row

---

**Step 8.9**
Role: Full Stack Developer
Task: Build the Admin App Settings page at `app/admin/settings/page.tsx` — the single place where all external service credentials are managed. The page has two top-level tabs: **Services** and **AI Prompts**.

**Services tab — AI / LLM Providers section (the most important section):**
- Shows a list of all saved `LlmConfig` records as individual cards
- Each card contains:
  - **Label** — a short display name the admin gives this config (e.g. "Groq Free Tier", "OpenAI GPT-4o")
  - **Provider dropdown** — options: OpenAI, Groq, Gemini, Hugging Face, OpenRouter, Custom. When a provider is selected, the Base URL field auto-fills with the known endpoint for that provider but remains editable:
    - OpenAI → `https://api.openai.com/v1`
    - Groq → `https://api.groq.com/openai/v1`
    - Gemini → `https://generativelanguage.googleapis.com/v1beta/openai`
    - Hugging Face → `https://api-inference.huggingface.co/v1`
    - OpenRouter → `https://openrouter.ai/api/v1`
    - Custom → blank, user types their own
  - **Base URL** — editable text input (pre-filled by provider selection)
  - **API Key** — password field, shown as "••••••••" after first save, only updated if a new value is typed
  - **Model name** — single text input. Below it, show a greyed-out suggestion line with 2–3 example model names for the selected provider so the admin can copy one or type their own:
    - OpenAI: `gpt-4o · gpt-4o-mini · gpt-3.5-turbo`
    - Groq: `llama-3.3-70b-versatile · mixtral-8x7b-32768 · gemma2-9b-it`
    - Gemini: `gemini-2.0-flash · gemini-1.5-pro`
    - Hugging Face: `microsoft/Phi-3-mini-4k-instruct · HuggingFaceH4/zephyr-7b-beta`
    - OpenRouter: `meta-llama/llama-3.1-8b-instruct:free · mistralai/mistral-7b-instruct:free`
    - Custom: no suggestions
  - **Active toggle** — enables or disables this provider in the rotation. Inactive providers are kept but skipped by `lib/ai.ts`
  - **Test** button — calls `app/api/admin/settings/test-ai/route.ts` using only this provider's config and shows the response inline on the card
  - **Delete** button — removes the LlmConfig record after confirmation
- An **"+ Add Provider"** button at the bottom of the list creates a new blank card in edit mode
- Below the provider list, show a read-only **"Current rotation"** line: "Rotating through X active provider(s)" with the currently active one highlighted

**LLM provider cards are accordion-style** — each card shows only its header (label, provider badge, active dot, toggle) when collapsed. Clicking the header expands the fields. Collapsed by default so the page stays clean when many providers are added.

**Services tab — Email section (accordion, with active provider toggle):**
- Two email methods available: **Resend** and **SMTP**. Only one is active at a time — controlled by an "Active" toggle on each. Activating one deactivates the other. The `email_provider` AppSettings key stores which is active ("resend" or "smtp").
- **Resend card:** API Key (encrypted, masked after save), From Email Address, Active toggle, Test button (sends a real test email to the admin's own email address)
- **SMTP card:** Host (e.g. smtp.gmail.com), Port (e.g. 587), Username, Password (encrypted, masked), TLS toggle (on/off), From Email Address, Active toggle, Test button (sends a real test email via nodemailer)
- Both cards are accordion-style — collapsed shows just the provider name and active status
- `lib/email.ts` is the single shared email helper used by all features. It reads `email_provider` from AppSettings, then uses either Resend SDK or nodemailer depending on which is active. All email sending in the app goes through this helper — never direct SDK calls
- Install `nodemailer` and `@types/nodemailer` packages for SMTP support
- `app/api/admin/settings/test-smtp/route.ts` — reads SMTP settings from AppSettings, attempts to send a test email to the requesting admin's email address via nodemailer, returns success or detailed error

**Services tab — other sections (each with its own Save button, accordion-style):**
- **Payments:** RevenueCat API Key
- **Maps:** Google Places API Key
- **Marketing:** Mailchimp API Key, Mailchimp Audience ID
- Sensitive fields show "••••••••" after save and only update if a new value is entered

**API routes:**
- `app/api/admin/settings/route.ts` (GET and POST) — reads/writes AppSettings keys for email, payments, maps, marketing
- `app/api/admin/llm/route.ts` (GET, POST) — lists all LlmConfig records; creates a new one
- `app/api/admin/llm/[id]/route.ts` (PATCH, DELETE) — updates or deletes a specific LlmConfig record
- `app/api/admin/settings/test-ai/route.ts` — accepts a provider config payload, calls that provider directly with "Say hello", returns the response
- `app/api/admin/settings/test-smtp/route.ts` — reads saved SMTP config from AppSettings, sends a test email to the admin, returns success or error

---

**Step 8.10**
Role: Full Stack Developer
Task: Build the AI Prompts tab on the Admin App Settings page:
- Shows one card per AI feature, each with a large textarea containing the current system prompt for that feature
- Features and their AppSettings keys:
  - Symptom Checker → `prompt_symptom_check`
  - Breed Care Guide → `prompt_breed_guide`
  - Health Score → `prompt_health_score`
  - Visit Prep → `prompt_visit_prep`
  - Pet Care Advisor → `prompt_advisor`
  - Weekly Health Summary → `prompt_weekly_summary`
- Each card has a **Save** button and a **Reset to Default** button. Reset restores the default from `lib/prompts.ts` and removes the AppSettings override
- If a prompt has been customized, show a small "Custom" badge on the card header; if using the default, show "Default"
- Create `app/api/admin/settings/prompts/route.ts` (GET and POST) — reads/saves prompt keys via `lib/settings.ts`

---

## ✅ PHASE 8 TEST

- [ ] Non-admin user visiting `/admin` is redirected to dashboard
- [ ] `/setup` (one-time bootstrap page) shows secret form when no admins exist — promotes the signed-in user to ADMIN on correct secret
- [ ] `/setup` permanently shows "Setup complete" after first admin is created — POST returns 410
- [ ] Admin user can access all admin pages
- [ ] Admin Users page shows "Make Admin" button for OWNER users — promotes them correctly
- [ ] Admin Users page shows "Remove Admin" button for other admins — demotes them correctly
- [ ] An admin cannot modify their own account row
- [ ] AppSettings table exists in database
- [ ] Admin can add multiple LlmConfig providers via "+ Add Provider" — each saves independently
- [ ] Selecting a provider from dropdown auto-fills Base URL and shows model name suggestions below the model field
- [ ] Test button on a provider card calls that provider live and shows the response inline
- [ ] Active toggle on a provider enables/disables it in the rotation
- [ ] After saving at least one active LlmConfig, Breed Guide on pet page generates correctly (end-to-end proof lib/ai.ts works)
- [ ] LLM provider cards are accordion — collapsed shows header only, click expands fields
- [ ] Resend email card: API key saves, active toggle works, Test button sends a real email to admin
- [ ] SMTP email card: host/port/user/pass/TLS save correctly, active toggle works, Test button sends a real email via nodemailer
- [ ] Only one email provider is active at a time — activating one deactivates the other
- [ ] lib/email.ts routes all sending through the active provider (Resend or SMTP) — no hardcoded SDK calls
- [ ] Admin saves RevenueCat, Google Places, Mailchimp configs in Services tab
- [ ] AI Prompts tab shows all 6 feature prompts — custom edits save and are used by the AI
- [ ] "Reset to Default" restores the default prompt from lib/prompts.ts — "Default" badge shown
- [ ] Customized prompt shows "Custom" badge
- [ ] Deactivating a user prevents them from logging in
- [ ] EMR key generated — shown once — masked in table afterwards
- [ ] Analytics page shows correct counts

---

---

# PHASE 9 — AI Symptom Checker (Premium)

> **Goal:** Premium users can describe symptoms and get an urgency assessment. URGENT cases show nearby emergency vets.

---

**Step 9.1**
Role: Backend Developer
Task: Create the symptom checker API at `app/api/ai/symptom-check/route.ts`:
- Accepts: petId (optional), symptomText (string)
- Verifies the user has an active premium subscription before proceeding — return 403 if not premium
- Sends the symptoms and pet details (species, age, weight, known conditions) to the AI using `callAI()` from `lib/ai.ts`
- Instructs the AI to return a structured JSON with: urgencyLevel (URGENT | MONITOR | NON_URGENT), summary, reasoning, and recommendedActions
- Returns the structured response

---

**Step 9.2**
Role: Frontend Developer
Task: Build the Symptom Checker page at `app/dashboard/symptom-checker/page.tsx`:
- Pet selector dropdown (or "General — not specific to one pet")
- Large text input with placeholder "Describe what's wrong with your pet..."
- "Analyze Symptoms" button with loading state
- Results card showing the urgency level as a large colored banner (red for URGENT, orange for MONITOR, green for NON-URGENT), the AI summary, and the recommended actions
- "Start New Assessment" button to clear and start over
- If the user is not premium, show a locked state with an upgrade prompt instead

---

**Step 9.3**
Role: Full Stack Developer
Task: Build the nearby clinics feature for URGENT cases:
- Create `app/api/clinics/nearby/route.ts` — accepts lat/lng coordinates, reads the Google Places API key from AppSettings, and calls the Places API to find veterinary clinics within a 10-mile radius
- On the frontend, when the result is URGENT, request the user's location via the browser Geolocation API
- Fetch nearby clinics and display them as cards below the urgency banner
- Each clinic card shows: name, distance in miles, address, opening hours, a "Directions" button (opens Google Maps URL), and a "Call" button (opens `tel:` link)

---

## ✅ PHASE 9 TEST

- [ ] A free user sees an upgrade prompt — cannot access the checker
- [ ] A premium user can type symptoms and receive a result
- [ ] URGENT result shows a red banner with nearby clinic cards
- [ ] MONITOR result shows an orange banner with advice to schedule a vet visit
- [ ] NON-URGENT result shows a green banner with home care advice
- [ ] Each clinic card shows correct name, distance, address, and working buttons
- [ ] "Start New Assessment" clears the form and results

---

---

# PHASE 10 — AI Visit Prep

> **Goal:** Before a vet visit, the owner generates an AI-prepared summary of their pet's health to bring to the appointment.

---

**Step 10.1**
Role: Backend Developer
Task: Create `app/api/ai/visit-prep/[petId]/route.ts`:
- Fetches the pet's full health records, active medications, upcoming reminders, and recent vet visits
- Sends all data to the AI using `callAI()` from `lib/ai.ts` with a prompt to return structured JSON with sections: currentConcerns, activeMedications, questionsForVet, upcomingCare, recentLabHighlights
- Returns the structured JSON

---

**Step 10.2**
Role: Frontend Developer
Task: Build the Visit Prep UI on the pet detail page (AI Tools tab):
- A "Generate Visit Prep" button with loading state
- Results displayed as clean section cards — one card per section with a header and bullet points
- A "Share" button that copies a formatted plain-text version of the summary to the clipboard
- A "Regenerate" button to refresh the summary

---

## ✅ PHASE 10 TEST

- [ ] Generating visit prep calls the API and returns structured results
- [ ] All 5 sections display as cards with correct content
- [ ] Share button copies clean formatted text to clipboard
- [ ] Regenerate fetches a fresh result

---

---

# PHASE 11 — Pet Health Score (Premium)

> **Goal:** Premium users can generate an AI health score out of 100 for each pet with a breakdown and personalized recommendations.

---

**Step 11.1**
Role: Backend Developer
Task: Create `app/api/ai/health-score/[petId]/route.ts`:
- Verifies premium subscription
- Fetches all pet data (profile, records, vaccines, reminders, completed reminders history)
- Sends to AI using `callAI()` from `lib/ai.ts` with a prompt to score 6 categories (Vaccination Status, Preventive Care, Weight and Nutrition, Medication and Parasite Prevention, Dental and Grooming, Reminder Compliance) each out of 100, with an overall score and letter grade
- Returns: overallScore, grade, categories (array of {name, score, statusNote}), recommendations (array of {label: URGENT|SOON|TIP, text})

---

**Step 11.2**
Role: Frontend Developer
Task: Build the Health Score UI on the pet detail page:
- A circular ring progress indicator showing the overall score — green (80+), orange (60-79), red (below 60)
- The letter grade displayed in the center of the ring
- A row of 6 progress bars below, one per category, each with a label and status note
- A recommendations section with each recommendation shown as a labeled badge (red for URGENT, orange for SOON, blue for TIP) followed by the advice text
- A "Generate Health Score" button (first time) and "Regenerate" button (after first generation)
- Locked state with upgrade prompt for non-premium users

---

## ✅ PHASE 11 TEST

- [ ] Free user sees locked state with upgrade prompt
- [ ] Premium user generates a score — ring, grade, category bars, and recommendations all display
- [ ] Score color matches the correct range (green/orange/red)
- [ ] All 6 categories appear with a score and note
- [ ] Recommendations show the correct label type
- [ ] Regenerate fetches a new score

---

---

# PHASE 12 — Pet Care Advisor Chatbot

> **Goal:** Owners can have a conversation with an AI chatbot about any pet care question.

---

**Step 12.1**
Role: Backend Developer
Task: Create `app/api/ai/advisor/route.ts`:
- Accepts: petId (optional), message (string), conversationHistory (array of prior messages)
- Sends pet species and prior messages as context to the AI using `callAI()` from `lib/ai.ts`
- AI responds as a knowledgeable pet care advisor — species-aware, personalized to the selected pet
- Returns the AI response text and any product recommendation links if applicable

---

**Step 12.2**
Role: Frontend Developer
Task: Build the Pet Care Advisor page at `app/dashboard/advisor/page.tsx`:
- Pet selector at the top
- Message thread UI (user messages on right, AI on left)
- Text input with Send button
- Suggested starter questions displayed before the first message — 3 to 4 questions relevant to the selected pet's species
- Product recommendation links rendered as tappable links if present in the AI response
- "New Conversation" button to clear the thread

---

## ✅ PHASE 12 TEST

- [ ] Selecting a dog shows dog-specific suggested questions
- [ ] Selecting a cat shows cat-specific suggested questions
- [ ] Sending a message returns a relevant AI response
- [ ] Conversation history is maintained within the session
- [ ] Product links in AI responses are clickable
- [ ] "New Conversation" clears the thread

---

---

# PHASE 13 — QR Code Emergency Sharing (Premium)

> **Goal:** Every pet gets a unique QR code that links to a public read-only emergency page with the pet's full medical info.

---

**Step 13.1**
Role: Backend Developer
Task: Add a `qrToken` (unique string) field to the Pet model. Run migration. On pet creation, automatically generate and save a unique QR token. Create `app/api/pets/[id]/qr/route.ts` that returns the QR code as an image (use the `qrcode` npm package to generate it) pointing to the URL `/emergency/[qrToken]`.

---

**Step 13.2**
Role: Full Stack Developer
Task: Build the public emergency page at `app/emergency/[token]/page.tsx`:
- No authentication required — fully public
- Look up the pet by QR token
- Display a red emergency banner at the top: "EMERGENCY PET INFORMATION — READ ONLY"
- Pet photo (served from `/api/pets/[id]/photo`) or species emoji
- Pet name, species, breed, age, weight, color, microchip number
- Special notes and allergies highlighted prominently
- All health records grouped by type (vaccinations, medications, vet visits, surgeries)
- Use server-side rendering for fast load times

---

**Step 13.3**
Role: Frontend Developer
Task: Build the QR Code tab on the pet detail page:
- Show the generated QR code image
- "Download QR Code" button that downloads the QR image as a PNG file
- "Copy Link" button that copies the emergency page URL to clipboard
- Instructions: "Print this on a collar tag or save it to your phone. Anyone who scans it can see your pet's emergency information instantly."
- Locked state with upgrade prompt for non-premium users

---

## ✅ PHASE 13 TEST

- [ ] Free user sees locked state with upgrade prompt
- [ ] Premium user sees a QR code on the pet detail page
- [ ] QR code image downloads correctly
- [ ] Scanning the QR code (or visiting the URL directly) opens the emergency page
- [ ] Emergency page shows all correct pet data with no login required
- [ ] An invalid QR token shows a 404 page

---

---

# PHASE 14 — Vet Portal Access

> **Goal:** Owners generate access codes for their vets. Vets use the code to view records and submit structured visit notes.

---

**Step 14.1**
Role: Backend Developer
Task: Create the vet access API routes:
- `POST /api/vet-access` — generates a unique 8-character alphanumeric code, creates a VetAccess record linked to a pet, returns the code
- `GET /api/vet-access` — returns all active vet access records for the user's pets
- `DELETE /api/vet-access/:id` — revokes a vet access (sets isActive = false, records revokedAt)
- `POST /api/vet-portal/verify` — public route, accepts a code, returns the pet data if the code is valid and active

---

**Step 14.2**
Role: Frontend Developer
Task: Build the Vet Access section on the pet detail page:
- "Add Vet Access" button that generates a new code and shows it in a modal with copy-to-clipboard
- List of all linked vets (code, vet name if entered, created date)
- Revoke button next to each access entry (with confirmation)

---

**Step 14.3**
Role: Full Stack Developer
Task: Build the vet portal at `app/vet-portal/page.tsx`:
- Public page — no login required
- Code input field and "Access Records" button
- On valid code entry, show the pet profile and all health records (read-only view)
- A "Submit Visit Note" button that opens a structured form: Chief Complaint, Diagnosis, Treatments Given, Discharge Instructions, optional file upload
- On submit, create a VetVisitNote record, create a HealthRecord with source = VET_PUSHED, and send the owner an email notification (reads Resend config from AppSettings)

---

## ✅ PHASE 14 TEST

- [ ] Owner generates a vet access code — it appears in the active vet list
- [ ] Vet enters the code on the portal — sees the correct pet profile and records
- [ ] Vet submits a visit note — record appears in the owner's app with a blue VET_PUSHED badge
- [ ] Owner receives an email when the vet pushes a record
- [ ] Owner can revoke access — the code no longer works on the portal
- [ ] An invalid or revoked code shows an error on the portal

---

---

# PHASE 15 — Pet Sitter Access

> **Goal:** Owners generate temporary links for pet sitters with a defined expiry time and optional pet restrictions.

---

**Step 15.1**
Role: Backend Developer
Task: Create the sitter access API routes:
- `POST /api/sitter-access` — accepts label, expiresIn (1|3|7|30 days), and petIds array. Generates a secure random token, creates a SitterAccess record with the calculated expiry date
- `GET /api/sitter-access` — returns all sitter access links for the user
- `DELETE /api/sitter-access/:id` — revokes a sitter link
- `GET /api/sitter/[token]` — public route, validates the token is active and not expired, returns allowed pets with their profiles, upcoming reminders, and most recent health records

---

**Step 15.2**
Role: Frontend Developer
Task: Build the Sitter Access section in the dashboard settings page:
- "Create Sitter Link" button that opens a form: label input, duration selector (1 / 3 / 7 / 30 days), pet selector checkboxes (for users with multiple pets)
- After creation, show the shareable link with a copy button
- List all active sitter links with label, expiry date, and a Revoke button

---

**Step 15.3**
Role: Full Stack Developer
Task: Build the sitter view page at `app/sitter/[token]/page.tsx`:
- Public page — no login required
- Validates the token — shows a clear "This link has expired" message for expired or revoked tokens
- Shows the allowed pets with their profiles and photos
- Shows upcoming reminders for the next 7 days (medication schedules, vet appointments)
- Shows the most recent health record for each pet
- Read-only — no edit functionality

---

## ✅ PHASE 15 TEST

- [ ] Creating a sitter link generates a shareable URL with the correct expiry
- [ ] Sitter opens the link — sees allowed pets, reminders, and recent records
- [ ] Sitter cannot see pets that were not included in the link
- [ ] After the expiry period, the link shows an expired message
- [ ] Owner can revoke a link — it immediately shows as expired

---

---

# PHASE 16 — Rewards System (Premium)

> **Goal:** Premium users earn points for health-related actions and unlock badges as they reach milestones.

---

**Step 16.1**
Role: Backend Developer
Task: Build the points engine in `lib/rewards.ts`:
- Export `awardPoints(userId, action, points)` — creates a PointTransaction record and updates the user's total in RewardPoints
- Export `calculateTier(totalPoints)` — returns the tier name (0-100: New Member, 101-300: Pet Lover, 301-600: Dedicated Owner, 601-999: Expert Caregiver, 1000+: Platinum Pet Parent)
- Wire into all correct API routes: add pet = 50pts, add photo = 20pts, complete reminder = 15pts, log record = 10pts, generate health score = 10pts, symptom check = 10pts, PDF analysis = 10pts, set reminder = 5pts, daily login = 5pts
- Daily login: `app/api/auth/daily-login/route.ts` — called on first dashboard load each day, awards 5 points once per day

---

**Step 16.2**
Role: Backend Developer
Task: Build the achievement system in `lib/achievements.ts`:
- Define all 9 badges with unlock conditions
- After every `awardPoints()` call, check if any new achievements are unlocked
- If unlocked, create an Achievement record
- Badges: First Step (first login), Pet Parent (add first pet), Record Keeper (log 10 records), On Schedule (complete 5 reminders), AI Explorer (use AI checker once), Consistent Care (complete 30 reminders), Health Champion (generate 5 health scores), Family First (add a family member), Platinum Pet Parent (reach 1000 points)

---

**Step 16.3**
Role: Frontend Developer
Task: Build the Rewards page at `app/dashboard/rewards/page.tsx`:
- Premium gate — locked state with upgrade prompt for free users
- Current tier badge with tier name and progress bar to next tier
- Points total and last 10 point transactions
- Achievements grid — unlocked badges in color, locked badges greyed out with unlock condition shown

---

## ✅ PHASE 16 TEST

- [ ] Free user sees upgrade prompt on rewards page
- [ ] Adding a pet awards 50 points — shows in transaction history
- [ ] Completing a reminder awards 15 points
- [ ] Daily login awards 5 points — only once per day
- [ ] Tier updates correctly as points accumulate
- [ ] Badges unlock at the correct milestones and display as colored

---

---

# PHASE 17 — Subscriptions & Payments

> **Goal:** RevenueCat manages all web subscriptions. Premium features are gated correctly. Users can upgrade, manage, or cancel their subscription.

---

**Step 17.1**
Role: Backend Developer
Task: Set up RevenueCat for web:
- Install the RevenueCat Web SDK
- Create `lib/revenuecat.ts` — reads the RevenueCat API key from AppSettings via `lib/settings.ts`
- Create `app/api/subscriptions/checkout/route.ts` — initiates a RevenueCat checkout for the selected plan (monthly or annual)
- Create `app/api/subscriptions/status/route.ts` — checks the current user's subscription status and returns whether they are premium
- Create `app/api/webhooks/revenuecat/route.ts` — handles RevenueCat webhooks to update the Subscription record in the database when a subscription is created, renewed, or cancelled

---

**Step 17.2**
Role: Backend Developer
Task: Build the premium feature gate in `lib/premium.ts`:
- Export `isPremium(userId)` — checks the Subscription table for an active subscription
- Use in all premium feature API routes (symptom checker, health score, QR code, rewards)
- Create a reusable `<PremiumGate>` React component — shows children if premium, shows an upgrade card with a link to `/dashboard/upgrade` if not

---

**Step 17.3**
Role: Frontend Developer
Task: Build the upgrade page at `app/dashboard/upgrade/page.tsx`:
- Two plan cards: Monthly and Annual (with annual showing savings percentage)
- Each card lists all premium features
- "Get Premium" button initiates RevenueCat checkout
- If already subscribed, show current plan details, next renewal date, and a "Manage Subscription" button
- On successful payment, UI updates to reflect premium status

---

## ✅ PHASE 17 TEST

- [ ] Upgrade page shows monthly and annual plan options
- [ ] Clicking "Get Premium" initiates RevenueCat checkout
- [ ] After payment, Subscription record is created and premium features unlock
- [ ] Free user on any premium feature sees the PremiumGate upgrade prompt
- [ ] RevenueCat webhook correctly updates subscription status on renewal or cancellation

---

---

# PHASE 18 — EMR Integration

> **Goal:** Veterinary clinics can connect their hospital software to EmergePet via API key to push records automatically.

---

**Step 18.1**
Role: Backend Developer
Task: Create the EMR API authentication middleware at `lib/emr-auth.ts`. Accepts an `X-API-Key` header, hashes it, looks it up in the database, and returns the associated clinic or rejects with 401. Apply this middleware to all `/api/emr/*` routes.

---

**Step 18.2**
Role: Backend Developer
Task: Create the pet lookup endpoint at `app/api/emr/pets/route.ts`:
- Accepts query parameters: `microchip`, `name`, `species`, `dob` (at least one required)
- Returns matching pet profiles (id, name, species, breed, owner email) — never returns sensitive health data in the lookup step
- Rate limited to 100 requests per hour per API key

---

**Step 18.3**
Role: Backend Developer
Task: Create the record push endpoint at `app/api/emr/records/route.ts`:
- Accepts: petId, recordType, and all relevant record fields
- Creates the health record with source = VET_PUSHED
- Sends an email notification to the pet owner via Resend
- Returns 201 on success with the created record id

---

## ✅ PHASE 18 TEST

- [ ] An invalid API key receives a 401 response
- [ ] Valid API key can look up a pet by microchip number
- [ ] Valid API key can push a health record — record appears in owner's app with VET_PUSHED badge
- [ ] Owner receives an email notification when a clinic pushes a record
- [ ] Rate limiting blocks excessive requests from a single key

---

---

# PHASE 19 — Newsletter & Website Landing Page

> **Goal:** Build the public-facing landing page and ensure newsletter signups are captured correctly.

---

**Step 19.1**
Role: Frontend Developer
Task: Build the public home page at `app/page.tsx` (replaces the placeholder from Phase 1):
- Hero section: headline, subheadline, "Get Started Free" CTA button, app screenshot or mockup
- Features section: brief overview of the 6 key features with icons
- Pricing section: Free vs Premium comparison table
- Newsletter signup form: email input and subscribe button
- Footer with links

---

**Step 19.2**
Role: Backend Developer
Task: Create `app/api/newsletter/subscribe/route.ts`:
- Accepts an email address
- Adds the email to Mailchimp audience with the tag `website-signup`
- Returns success (does not reveal if the email already exists — always return success to prevent email enumeration)

---

## ✅ PHASE 19 TEST

- [ ] Landing page loads at `http://localhost:3333` without login
- [ ] All sections render correctly and are fully responsive
- [ ] Newsletter form submits and the email appears in Mailchimp with the `website-signup` tag
- [ ] "Get Started Free" CTA goes to the signup page

---

---

# PHASE 20 — Polish, Security & Launch Prep

> **Goal:** Harden the app, fix all edge cases, ensure full mobile responsiveness, and prepare for production.

---

**Step 20.1**
Role: Full Stack Developer
Task: Add global error handling:
- Create a custom 404 page at `app/not-found.tsx` with a friendly message and a "Go Home" button
- Create a global error boundary at `app/error.tsx` for unexpected errors
- Ensure all API routes return consistent error objects: `{ error: string, code: string }`

---

**Step 20.2**
Role: Frontend Developer
Task: Add loading states and skeleton screens:
- Every page that fetches data must show a skeleton loader while loading (not a blank page)
- All buttons that trigger async actions must show a loading spinner and be disabled during the request
- All forms must show a loading state on submit

---

**Step 20.3**
Role: Frontend Developer
Task: Full mobile responsiveness audit:
- Test every page at 375px (mobile), 768px (tablet), and 1280px (desktop)
- All layouts must be usable at 375px
- Navigation must include a mobile-friendly bottom nav or hamburger menu on small screens
- All modals must be scrollable on small screens

---

**Step 20.4**
Role: Backend Developer
Task: Security hardening:
- Add rate limiting to all auth routes (login, signup, password reset) — max 10 requests per minute per IP
- Add input validation and sanitization on all API routes using Zod schema validation
- Add CORS headers to restrict API access to the app domain only (except EMR routes which use API key auth)
- Ensure no sensitive data (passwords, tokens, API keys) is ever returned in API responses

---

**Step 20.5**
Role: Full Stack Developer
Task: SEO and metadata:
- Add `metadata` exports to all public-facing pages (title, description, Open Graph image)
- Create `app/sitemap.ts` generating a dynamic sitemap
- Create `app/robots.ts` with appropriate rules (block `/admin`, `/api`, `/dashboard`)

---

**Step 20.6**
Role: Full Stack Developer
Task: Performance:
- All pet and record images must use Next.js `<Image>` component with proper width, height, and lazy loading
- Large list pages (records, reminders) must implement pagination or infinite scroll
- Run `next build` and fix any build warnings or errors

---

**Step 20.7**
Role: Frontend Developer
Task: Dark / Light Theme:
- Add `next-themes` package (`npm install next-themes`)
- Wrap the root layout with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` from `next-themes`
- Enable Tailwind dark mode: set `darkMode: "class"` in `tailwind.config.ts`
- Define a full set of CSS custom properties in `globals.css` for both `:root` (light) and `.dark` (dark) — covering background, surface, border, text-primary, text-secondary, brand, and brand-hover
- Update all shared components (Button, Input, NavBar, Sidebar, Card) to use semantic Tailwind dark classes (`dark:bg-*`, `dark:text-*`, `dark:border-*`) rather than hardcoded colors
- Add a `ThemeToggle` component (`components/ui/ThemeToggle.tsx`) with a sun/moon icon button — accessible with `aria-label`
- Place `ThemeToggle` in the dashboard NavBar and in the user account settings page
- Auth pages (login, signup, forgot-password, reset-password) must also support dark mode — update their card and background colors
- Test: toggling the theme must switch every page without a flash of unstyled content (FOUC). Verify color contrast meets WCAG AA in both modes.

---

## ✅ PHASE 20 FINAL TEST — Full End-to-End

Before declaring the project complete, verify the following complete user journeys work without errors:

**Journey 1 — New Free User:**
- [ ] Sign up → onboarding → add pet → add health records → set reminders → view care tips → invite family member

**Journey 2 — Premium User:**
- [ ] Upgrade subscription → use symptom checker → generate health score → generate QR code → view rewards

**Journey 3 — Vet Access:**
- [ ] Owner generates vet code → vet opens portal → vet submits visit note → owner sees record with badge

**Journey 4 — Pet Sitter:**
- [ ] Owner creates sitter link → sitter opens link → sitter sees pets and reminders → link expires and shows expired

**Journey 5 — Clinic PDF Upload:**
- [ ] Owner requests records from clinic → clinic receives email → clinic uploads PDF → owner sees records

**Journey 6 — Admin:**
- [ ] Admin logs in → views users → generates EMR key → views subscriptions

**Final Checks:**
- [ ] `npm run build` completes with zero errors
- [ ] TypeScript compiles with zero errors
- [ ] All pages are responsive on mobile (375px)
- [ ] No console errors on any page in production build

---

---

## Current Build Status

> Update this section as phases are completed.

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Foundation | ✅ Complete | |
| Phase 2 — Authentication | ✅ Complete | |
| Phase 3 — Onboarding & Accounts | ✅ Complete | |
| Phase 4 — Pet Profiles | ✅ Complete | |
| Phase 5 — Health Records | ✅ Complete | |
| Phase 6 — Reminders | ✅ Complete | |
| Phase 7 — Care Tips & Breed Guide | ✅ Complete | |
| Phase 8 — Admin Panel & Dynamic App Settings | ✅ Complete | Multi-provider LLM rotation, accordion cards, Resend + SMTP email, dynamic AI prompts, one-time bootstrap page |
| Phase 9 — AI Symptom Checker | ✅ Complete | lib/premium.ts, /api/ai/symptom-check, /api/clinics/nearby, symptom checker page with URGENT/MONITOR/NON_URGENT banner + nearby vet clinics |
| Phase 10 — AI Visit Prep | ✅ Complete | /api/ai/visit-prep/[petId] GET route, VisitPrepTab component with 5 section cards, Share (clipboard) + Regenerate, wired into pet detail AI Tools tab |
| Phase 11 — Pet Health Score | ✅ Complete | /api/ai/health-score/[petId] with 6-category scoring, HealthScoreTab with SVG ring/grade/bars/URGENT-SOON-TIP badges, AIToolsTab sub-tab switcher (Visit Prep + Health Score), isPremium passed from server |
| Phase 12 — Pet Care Advisor | ✅ Complete | /api/ai/advisor POST with species-aware context + conversation history, advisor chat page with pet selector/starter questions (dog/cat/bird/rabbit)/chat thread/New Conversation, Advisor added to DashboardNav |
| Phase 13 — QR Code Emergency Sharing | ✅ Complete | qrToken on Pet model, backfill script, auto-generate on creation, /api/pets/[id]/qr PNG route, /emergency/[token] public SSR page with red banner + grouped records, QrCodeTab with Download + Copy Link + locked state |
| Phase 14 — Vet Portal | ✅ Complete | POST/GET/DELETE /api/vet-access, POST /api/vet-portal/verify (public), POST /api/vet-portal/submit-note (creates VetVisitNote + VET_PUSHED HealthRecord + owner email), VetAccessTab with modal + revoke, /vet-portal public page with code entry + records + visit note form |
| Phase 15 — Pet Sitter Access | ✅ Complete | POST/GET/DELETE /api/sitter-access + public GET /api/sitter/[token], SitterAccessSection in dashboard settings (label/duration/pet selector, copy link, revoke with confirm), /sitter/[token] public SSR page (expired state, pet profiles + photos, 7-day reminders with colour badges, most recent health record, read-only footer) |
| Phase 16 — Rewards System | ✅ Complete | lib/points.ts with awardPoints+calculateTier (5 tiers)+checkAchievements (9 badges), wired into: add pet (50), add photo (20), complete reminder (15), log record (10), health score (10), symptom check (10), PDF analysis (10), set reminder (5), daily login (5pts via /api/auth/daily-login + DailyLogin client component in DashboardNav), /dashboard/rewards page (premium gate, tier card+progress bar, badges grid with locked/unlocked states, last 10 transactions, how to earn section), Rewards link in DashboardNav |
| Phase 17 — Subscriptions & Payments | ✅ Complete | lib/revenuecat.ts (PLANS config, getRevenueCatApiKey, getSubscriberEntitlements, planFromProductId), POST /api/subscriptions/checkout (RevenueCat checkout URL), GET /api/subscriptions/status (isPremium + plan + renewal date), POST /api/webhooks/revenuecat (handles INITIAL_PURCHASE/RENEWAL/CANCELLATION/EXPIRATION → upserts Subscription), isPremium() confirmed (ADMIN always true, checks status+currentPeriodEnd), PremiumGate component (lock icon, feature list, upgrade link), /dashboard/upgrade page (Monthly+Annual plan cards, savings %, feature list, Manage Subscription for subscribers), Upgrade link in DashboardNav |
| Phase 18 — EMR Integration | ✅ Complete | lib/emr-auth.ts (SHA-256 key hash, isActive check, lastUsedAt update, emrUnauthorized helper), GET /api/emr/pets (search by microchip/name/species/dob, in-memory rate limit 100 req/hr, excludes photoData), POST /api/emr/records (VET_PUSHED source, owner email notification, 201 response), EmrKey schema confirmed (keyHash, revokedAt, lastUsedAt), 38/38 tests passed |
| Phase 19 — Newsletter & Landing Page | ✅ Complete | app/page.tsx (sticky nav, hero with CTA→/signup, 6 feature cards, 3-step how-it-works, Free vs Premium pricing table with MOST POPULAR badge+savings %, newsletter section, footer), components/landing/NewsletterForm.tsx (use client, email input, success state, POST /api/newsletter/subscribe), POST /api/newsletter/subscribe (Mailchimp via AppSettings keys+website-signup tag, always returns success), 33/33 tests passed |
| Phase 20 — Polish & Launch Prep | ✅ Complete | app/not-found.tsx (404 + dark mode), app/error.tsx (global error boundary), app/loading.tsx + app/dashboard/loading.tsx (skeleton screens), DashboardNav full mobile hamburger menu + admin link visible in nav for admin users, AdminNav mobile-responsive (slide-down on mobile), lib/rate-limit.ts (IP-based rate limiting), register route rate limited, zod + next-themes installed, app/sitemap.ts + app/robots.ts (blocks /admin /dashboard /api), full OpenGraph+Twitter metadata on root layout, img lint warnings fixed, darkMode:"class" in tailwind.config.ts, CSS custom properties for light+dark in globals.css, ThemeProvider in Providers.tsx, suppressHydrationWarning on html, ThemeToggle (sun/moon, aria-label) in DashboardNav + settings page, Button+Input components with dark: classes, dashboard layout + pages with dark: classes, 55/55 tests passed |

---

## What Comes After This Document

This document covers the complete website build (Project Phase 1). Once all 20 phases are complete and the website is live, the mobile app build begins.

The mobile app plan is documented separately in **MASTER_PROMPT_MOBILE.md** — to be created when the website is done. The mobile app uses React Native + Expo and calls the same backend APIs built in this document. No backend work needs to be repeated.
