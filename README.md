# Carrie Notes

Carrie Notes is an MVP for **Care Handover AI**: pet owners create structured care profiles that can be securely shared with temporary caregivers, who can then ask an AI chat questions that are grounded only in the owner-provided profile and documents.

**Live demo:** [carrie-notes.vercel.app](https://carrie-notes.vercel.app)

## Stack

- Next.js 14, App Router, TypeScript, Tailwind CSS
- Supabase: Auth, Postgres, Storage, pgvector
- OpenAI: document extraction, embeddings, and chat

## Local setup

1. Copy `.env.local.example` to `.env.local` and fill in the Supabase and OpenAI values.
2. In Supabase Dashboard, set **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in from `/login` using a magic link.

## Current functionality

- Magic-link owner authentication and protected dashboard routes
- Pet profile CRUD with tabs for basic information (including gender), routine, meals, medical care, behavior, emergency plans, and vaccinations
- Text- and voice-first care entry: describe a meal, medication, routine, or full profile naturally, then review structured suggestions before either updating matching fields or only filling blanks
- One-time Quick Fill from a document, voice note, or optional vaccination document using OpenAI; temporary files and transcripts are not stored in Supabase
- A persistent per-pet document library (vet records, care instructions, etc.) with text extraction, separate from the one-time Quick Fill above
- A read-only `/care/[shareToken]` link owners can share with a caregiver — no caregiver account needed, access is scoped to a single pet via a narrowly-permissioned database function rather than broad public policies
- An AI chat on that shared page, grounded only in the pet's saved profile and documents (pgvector similarity search + OpenAI), with source citations and honest "not covered" answers instead of guessing; caregiver conversations are logged so the owner can review past questions
- Owner-scoped API routes protected by Supabase Auth and RLS

See [progress.md](progress.md) for the build status and [schema.md](schema.md) for the finalized database model.

## Deployment

Deployed on Vercel. To deploy your own:

1. Import the repo into Vercel (Next.js is auto-detected, no build config changes needed).
2. Set the same four environment variables from `.env.local.example` in the Vercel project's Settings → Environment Variables.
3. In Supabase Dashboard → **Authentication → URL Configuration**, add the production domain alongside (not instead of) the localhost entries:
   - Site URL: `https://<your-vercel-domain>`
   - Redirect URL: `https://<your-vercel-domain>/auth/callback`

## Checks

```bash
npm run lint
npm run build
```
