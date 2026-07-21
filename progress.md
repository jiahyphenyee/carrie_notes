# Build Progress

## Step 1 — Project scaffold and clients ✓

- Created a Next.js 14 App Router project with TypeScript and Tailwind CSS.
- Installed Supabase, OpenAI, React Hook Form, and Zod.
- Added `.env.local.example` with the required Supabase and OpenAI environment variables.
- Added browser Supabase, service-role API, and OpenAI client helpers.

## Step 2 — Database schema ✓

- Applied the owner-provided finalized Supabase schema.
- Enabled pgvector and created tables for pets, care details, documents, vaccinations, RAG chunks, and chat history.
- Configured owner-facing RLS policies and the private `pet-documents` bucket.
- Documented the finalized schema in [schema.md](schema.md).

## Step 3 — Owner profile MVP ✓

- Added passwordless magic-link sign-in, callback session exchange, dashboard middleware protection, and logout.
- Built reusable, consistent dashboard UI primitives and a tabbed pet profile form.
- Implemented pet create, list, detail, edit, and delete flows.
- Added care-detail and vaccination saving, using the existing `care_details` and `vaccinations` tables.
- Added one-time OpenAI Quick Fill: source files are deleted after extraction and are never persisted to Storage or document tables.
- Redesigned profile entry around reusable “Tell Carrie” controls: owners can type or record a natural-language care note in the relevant tab, review the transcript and suggestions, then choose between updating matching fields or only filling blanks.
- Added temporary audio transcription with `gpt-4o-mini-transcribe` before structured extraction.
- Added an optional vaccination-document field that suggests vaccination details and is discarded after processing.
- Sanitizes all extraction output before it reaches the UI, preventing blank placeholder meals, medications, habits, or vaccinations from being created.
- Fixed shared input and textarea ref forwarding so React Hook Form can populate parsed values after an owner applies suggestions.
- Added authenticated pet and vaccination API routes with server-side Zod validation.
- Verified `npm run lint` and `npm run build`.

## Step 4 — Caregiver share view ✓

- Added `get_shared_pet(p_share_token text)`, a `SECURITY DEFINER` Postgres function (`supabase/sql/004_caregiver_share_function.sql`) that returns one pet's profile, care details, and vaccinations by `share_token`, excluding `owner_id` and the token itself. Granted `EXECUTE` to `anon`/`authenticated` only — no public RLS `SELECT` policies were added.
- Added an anon-key `createPublicClient` helper (`lib/supabase/public-server.ts`) for unauthenticated reads, used only to call the RPC above.
- Added `GET /api/care/[shareToken]`, which calls the RPC and reuses the existing `mapPetRecord` mapper.
- Built the read-only `/care/[shareToken]` caregiver page, reusing `PetProfileView` with edit/delete actions and the share-link card removed, plus a friendly not-found state for invalid or revoked tokens.
- Verified `npm run lint` and `npm run build`.

## Step 5 — Document upload and text extraction ✓

- Added a permanent per-pet document library, separate from Step 3's ephemeral Quick Fill: owners can upload vet records, care instructions, or other files that stay attached to the profile for the later RAG workflow (Steps 6–7).
- Added `lib/document-extraction.ts`: plain-text files are decoded directly; PDFs, images, and Office docs are extracted via the same OpenAI Files + Responses pattern as `app/api/extract/route.ts`, but requesting verbatim text instead of structured fields. Extraction is best-effort — a failure still lets the document save with empty `extracted_text`.
- Added owner-authenticated `GET`/`POST /api/pets/[id]/documents`, `DELETE /api/pets/[id]/documents/[documentId]`, and a signed-URL `GET .../documents/[documentId]/download`.
- Discovered Step 2 had *not* actually finished RLS for this table/bucket: `documents` and the `pet-documents` bucket had no owner-scoped policies yet. Added them in `supabase/sql/005_document_library_policies.sql` (owner-authenticated inserts were failing with a bare RLS violation until this ran, then failing again from a self-referencing-column bug in the storage policy — fixed by qualifying `storage.objects.name` explicitly, since the correlated `pets` subquery otherwise shadowed it with `pets.name`).
- Discovered `documents.document_type` has a check constraint (undocumented, not visible via schema introspection) restricting it to a fixed set. Found the allowed values by probing with the service-role key: `vet_report`, `medical_history`, `prescription`, `insurance`, `other` — captured in `lib/document-types.ts` and used to drive a select dropdown instead of a free-text label.
- Added `components/document-library.tsx`: a compact "Upload any document" button in the pet detail page's header actions (next to Edit/Delete) that opens a modal with the type dropdown, file input, upload confirmation, and the existing document list (view/delete) — kept off the main profile layout by request, and not exposed on the caregiver `/care/[shareToken]` view.
- Verified `npm run lint`, `npm run build`, and an end-to-end manual upload of both a plain-text and a PDF document.

## Remaining steps

6. Embeddings and pgvector similarity search
7. AI chat with source citations and unavailable-information handling
8. UX polish
9. Vercel deployment
10. Demo preparation
