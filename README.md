# Carrie Notes

Carrie Notes is an MVP for **Care Handover AI**: pet owners create structured care profiles that can be securely shared with temporary caregivers. Future caregiver questions will be grounded only in the owner-provided profile and documents.

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
- Pet profile CRUD with tabs for basic information, routine, meals, medical care, behavior, emergency plans, and vaccinations
- Text- and voice-first care entry: describe a meal, medication, routine, or full profile naturally, then review structured suggestions before either updating matching fields or only filling blanks
- One-time Quick Fill from a document, voice note, or optional vaccination document using OpenAI; temporary files and transcripts are not stored in Supabase
- Owner-scoped API routes protected by Supabase Auth and RLS

See [progress.md](progress.md) for the build status and [schema.md](schema.md) for the finalized database model.

## Checks

```bash
npm run lint
npm run build
```
