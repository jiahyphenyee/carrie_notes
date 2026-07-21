# Finalized Supabase Schema

The database schema was supplied and applied by the project owner in Step 2. Application code must use these table names and relationships.

## Extensions and storage

- `vector` extension is enabled for pgvector embeddings.
- Private storage bucket: `pet-documents`.

## Tables

| Table | Purpose | Key relationships |
| --- | --- | --- |
| `pets` | Core pet profile and secure `share_token` | `owner_id` → `auth.users.id` |
| `care_details` | One JSON-backed care profile per pet: routine, meals, medical, behavior, emergency | unique `pet_id` → `pets.id` |
| `documents` | Persisted uploaded documents for the later document/RAG workflow | `pet_id` → `pets.id` |
| `vaccinations` | Structured vaccination and expiry tracking | `pet_id` → `pets.id` |
| `doc_chunks` | Searchable RAG chunks with `vector(1536)` embeddings | `pet_id` → `pets.id` |
| `chat_sessions` | Separate caregiver conversations for a shared pet | `pet_id` → `pets.id` |
| `chat_messages` | User/assistant messages inside a chat session | `session_id` → `chat_sessions.id` |

## JSON field shapes

`care_details.routine` stores `{ walks, sleep }`.

`care_details.meals` stores an array of `{ time, food, portion, notes }`.

`care_details.medical` stores `{ conditions, allergies, medication, vet_details }`. Each medication has `name`, `dosage`, `type` (`consistent` or `as_needed`), `schedule`, `scenario`, and `notes`.

`care_details.behavior` stores `{ likes, dislikes, triggers, commands, comfort_routines, habits }`. Each habit has `behavior`, `symptoms`, and `steps`.

`care_details.emergency` stores `{ contacts, instructions }`.

`documents.document_type` has a check constraint (not visible via schema introspection — found by probing) restricting it to `vet_report`, `medical_history`, `prescription`, `insurance`, or `other`. See `lib/document-types.ts`.

## Temporary extraction inputs

Text notes, voice notes, Quick Fill documents, and the optional vaccination-document form input are processing-only aids in Step 3. They do not create `documents` rows, upload to `pet-documents`, or alter the schema. Once the owner reviews and saves, only the resulting structured care fields and vaccination records are persisted.

## Access model

- Row Level Security is enabled on all application tables.
- Signed-in owners can manage only records attached to their own pets. The `documents` table and `pet-documents` bucket did not actually have owner-scoped policies until Step 5 added them (`supabase/sql/005_document_library_policies.sql`); Step 2's progress notes claiming this was already configured were inaccurate for these two.
- Owners can view, but cannot directly manage through RLS, caregiver chat history.
- Caregiver access is implemented through `get_shared_pet(p_share_token text)`, a narrowly scoped `SECURITY DEFINER` function keyed on `pets.share_token` (`supabase/sql/004_caregiver_share_function.sql`), rather than broad public RLS policies. It is callable by the `anon` role and returns only the matching pet's profile, care details, and vaccinations — never `owner_id` or the token itself.

## RAG index

`doc_chunks.embedding` is `vector(1536)` and has an IVFFlat cosine-similarity index, populated by `lib/indexing.ts` from `text-embedding-3-small` (1536 dims, matching the column exactly). `doc_chunks` had RLS enabled since Step 2 but no owner-scoped policy until Step 6 added one (`supabase/sql/006_embeddings_setup.sql`), same gap as `documents` before Step 5.

Caregiver-facing retrieval goes through `match_pet_chunks(p_share_token text, p_query_embedding vector(1536), p_match_count int)`, a `SECURITY DEFINER` function in the same file, keyed on `share_token` like `get_shared_pet` rather than a raw `pet_id`.
