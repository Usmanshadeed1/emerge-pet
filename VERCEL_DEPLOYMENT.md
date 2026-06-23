# EmergePet — Deployment Guide

## Live Deployment
- **Platform:** Vercel (https://emerge-pet.vercel.app)
- **Repository:** https://github.com/Usmanshadeed1/emerge-pet
- **Database:** Neon PostgreSQL (AWS US East 1 — N. Virginia)
- **Auto-deploy:** Every push to `master` branch automatically deploys to Vercel

---

## How Auto-Deploy Workss
1. Developer pushes code to GitHub (`master` branch)
2. Vercel detects the push automatically
3. Vercel runs `prisma generate && next build`
4. New version goes live — no manual steps needed

---

## First-Time Setup (Already Done — Do Not Repeat)

### Step 1 — Neon Database
- Created a free PostgreSQL database at https://neon.tech
- Project: `neondb` — Region: AWS US East 1
- Ran `npx prisma db push` to create all tables on Neon
- Connection string format:
  ```
  postgresql://neondb_owner:PASSWORD@ep-dark-sea-ads0gwpa.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```

### Step 2 — Vercel Environment Variables
These are set in Vercel → Project → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth.js secret key (keep this safe) |
| `NEXTAUTH_URL` | Full Vercel URL e.g. `https://emerge-pet.vercel.app` |
| `SETUP_SECRET` | Used to promote first admin at `/admin/setup` |
| `CRON_SECRET` | Secures the cron job endpoints |

### Step 3 — Vercel Cron Jobs (vercel.json)
Cron jobs are configured in `vercel.json` in the project root:
- Reminder emails → runs daily at 8am UTC
- Weekly health summary → runs every Monday at 9am UTC

### Step 4 — First Admin Account
After deployment, set up the admin account:
1. Go to `https://emerge-pet.vercel.app/signup` — create a new account
2. Go to `https://emerge-pet.vercel.app/admin/setup`
3. Enter the `SETUP_SECRET` value to promote that account to Admin

**Admin Setup Credentials:**
- Setup page: `https://emerge-pet.vercel.app/admin/setup`
- Setup Secret: `EmergePetAdmin2024!`
- After setup, log in at: `https://emerge-pet.vercel.app/login`
- Admin panel: `https://emerge-pet.vercel.app/admin`

> Note: The setup page only works ONCE. After the first admin is created, it permanently shows "Setup complete" and rejects all requests.

---

## If You Need to Reset the Database
Run this command locally with the Neon connection string:
```
set DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-dark-sea-ads0gwpa.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
npx prisma db push
```

## If You Change the Prisma Schema
After changing `prisma/schema.prisma`, run:
```
npx prisma db push
```
This updates the Neon database tables to match the new schema.

---

## Local Development
Use the `.bat` start file on the desktop — runs the app on `http://localhost:3333`
Local database is a separate PostgreSQL on `localhost:5432` (not the Neon one)

---

## Important Notes
- The Neon database password was reset after initial setup for security
- AI/LLM providers, email (SMTP), and all other settings are configured via the Admin Panel at `/admin/settings` — not in environment variables
- Google and Apple OAuth are not yet configured (credentials needed in Vercel env vars)
