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

## Step 6 — Embeddings and pgvector similarity search ✓

- Added owner-scoped RLS for `doc_chunks` (same gap as Step 5's `documents` fix — RLS was enabled since Step 2 but had no policy) and `match_pet_chunks(share_token, query_embedding, match_count)`, a `SECURITY DEFINER` function keyed on `share_token` (same pattern as `get_shared_pet`), in `supabase/sql/006_embeddings_setup.sql`.
- Discovered `match_pet_chunks` needs `extensions` in its `search_path`, not just `public`: pgvector's `<=>` operator lives in the `extensions` schema on this project, and a `SECURITY DEFINER` function's `search_path` is fixed at creation, not inherited from the caller — the function was created successfully but failed at call time with `operator does not exist: extensions.vector <=> extensions.vector` until fixed.
- Added `lib/chunking.ts` (paragraph-aware overlapping chunks), `lib/embeddings.ts` (`text-embedding-3-small`, 1536 dims — matches `vector(1536)` exactly), and `lib/profile-text.ts` (formats non-empty care sections into citable prose).
- Added `lib/indexing.ts` (`indexDocumentChunks`, `indexProfileChunks`) and wired it into document upload/delete and pet create/update, all best-effort so indexing failures never block a save.
- Added `POST /api/pets/[id]/reindex` (owner-authenticated) to backfill pets/documents saved before this step, exposed as an "Update Carrie's answers" button next to "Upload any document" on the pet detail page.
- Added `POST /api/care/[shareToken]/ask`: embeds the question, retrieves chunks via `match_pet_chunks`, keeps only chunks within a relative-similarity margin of the top match (a fixed similarity cutoff proved unreliable — tested empirically, see below), and has the model answer strictly from that filtered context, falling back to "I don't have that information" without calling the model when nothing relevant is indexed. A stateless Q&A endpoint Step 7's chat UI will call.
- Verified `npm run lint`, `npm run build`, and retrieval/answer accuracy end-to-end: both `match_pet_chunks` and `/ask` are anon-callable, so this was scripted directly via `curl` against Mochi's real profile (no browser session needed). Confirmed correct answers with accurate, non-hallucinated sources for direct questions, correct "not covered" handling for an off-profile question and an invalid share token, and — prompted by a question about whether keyword tagging per section would meaningfully help retrieval — tested five paraphrased questions using vocabulary that deliberately didn't match the stored text (e.g. "shot" vs "vaccine", "dinner" vs "meals"). All five still retrieved the correct section with a clear margin, showing `text-embedding-3-small` already generalizes synonyms well at this corpus size; tagging was deferred as a low-priority polish rather than a needed fix.
- Follow-up browser testing (uploading a new document and saving a profile edit without manually reindexing, to prove the automatic indexing on those write paths — not just the manual reindex button — actually fires) surfaced a real answer-reliability bug: `/ask` retrieved the correct chunk (a "swimming" mention inside a longer "Likes" list) but the model inconsistently claimed the context didn't cover it — 1 of 3 tries wrong. Fixed by tightening `answerInstructions` to require reading every chunk fully before concluding something is missing, explicitly calling out short facts embedded in longer lists, and adding `temperature: 0.1` for consistency; retested 5/5 correct afterward, with the "not covered" and invalid-token regression cases still passing.

## Step 7 — AI chat with source citations and unavailable-information handling ✓

- Added owner-scoped `SELECT`-only RLS on `chat_sessions`/`chat_messages` (same "enabled but no policy" gap as every prior table) and `send_chat_message(share_token, session_id, caregiver_label, role, content)`, a `SECURITY DEFINER` function keyed on `share_token` (same pattern as `get_shared_pet`/`match_pet_chunks`) that resolves or creates the session and inserts one message, in `supabase/sql/007_chat_history.sql`.
- Extended `POST /api/care/[shareToken]/ask` to accept `session_id`/`caregiver_label` and log both the caregiver's question and Carrie's answer via `send_chat_message`, best-effort, returning `session_id` so the client can continue the same conversation.
- Added `components/care-chat.tsx`: the actual chat UI on `/care/[shareToken]`, above the read-only profile view — message bubbles, source-citation tags under each answer, `session_id` persisted in `localStorage` so a page refresh continues the conversation, and an optional one-time "Your name" field.
- Added owner-authenticated `GET /api/pets/[id]/chat-sessions` and `components/chat-history.tsx` (same button-opens-modal pattern as `document-library.tsx`) so owners can review past caregiver conversations, wired into the pet detail page's header actions.
- Verified `npm run lint` and `npm run build`.

## Step 8 — UX polish ✓

- Added a `gender` field to Basic information (`supabase/sql/008_add_gender_column.sql`, a plain `alter table` since `pets` had no such column): a small select ("Not specified"/Female/Male/Unknown) in `pet-form.tsx`, wired through `lib/pets.ts`, `lib/pet-validation.ts`, both pet API routes, and displayed in `pet-profile-view.tsx`. Deliberately left out of embeddings, consistent with the rest of Basic information.
- Reviewed every page/component for rough edges left behind by incremental feature work, then refined further against feedback: Documents went back to being a visible inline `Section` (compact rows, a small "+" icon button opens the same upload modal, small view/delete icon buttons) instead of hidden behind one button; the caregiver-questions modal was restructured from one long message dump into a session-card list that drills into a single conversation, so it won't become unusable as real history accumulates.
- Added `components/confirm-dialog.tsx`, a reusable confirmation overlay, replacing `window.confirm()` for pet delete and document delete; both now use `Button`'s existing (previously unused) `danger` variant instead of `ghost`, so destructive actions actually look destructive.
- Rebalanced the pet detail page header into two tiers: "Edit profile"/"Delete" stay prominent; "Caregiver questions" and "Update Carrie's answers" moved to a lighter secondary row.
- `components/care-chat.tsx`: bounded, auto-scrolling message container and a "Carrie is thinking…" pending bubble while waiting on a response.
- Standardized "Loading…" copy/punctuation across `dashboard/page.tsx`, the pet detail page, the edit page, and `/care/[shareToken]`.
- Flagged but did not touch: `app/api/pets/[id]/vaccinations/route.ts` and `.../[vaccinationId]/route.ts` appear to be dead code (`pet-form.tsx` saves vaccinations only through the bulk profile PATCH) — left for the owner to confirm before removing.
- Follow-up feedback after visual verification: Documents' view/delete icon buttons went back to labeled "View"/"Delete" text buttons (compact size, but icons alone weren't clear enough). "Update Carrie's answers" gained its own `ConfirmDialog` explaining what the action actually does (rebuilds the search index from the current profile/documents; doesn't change the profile) before running it — previously it ran immediately with no explanation. `ConfirmDialog` gained a `confirmVariant` prop (`"danger"` default for deletes, `"primary"` for this non-destructive case) since the confirm button shouldn't look destructive for a safe action.
- Verified `npm run lint` and `npm run build`, plus real-browser verification via Playwright (fetched temporarily through `npx`, not added as a dependency) driving `/care/[shareToken]` headlessly: confirmed the Gender field renders, the pending "Carrie is thinking…" bubble and disabled input/button appear mid-request, source-citation tags render under answers, and the message list scrolls in a bounded auto-scrolling container across multiple exchanges, with zero console errors. Owner-authenticated pages (inline Documents section, header hierarchy, confirm dialogs, chat-history drill-down, the two follow-up fixes) needed manual verification since login can't be scripted (magic-link, no bypass).

## Remaining steps

9. Vercel deployment
10. Demo preparation
