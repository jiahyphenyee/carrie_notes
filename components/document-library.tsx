"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DOCUMENT_TYPES, documentTypeLabel } from "@/lib/document-types";

type Document = {
  id: string;
  file_name: string;
  document_type: string;
  created_at: string;
};

type Props = { petId: string };

export function DocumentLibrary({ petId }: Props) {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/pets/${petId}/documents`);
    const data = await response.json();
    if (response.ok) setDocuments(data.documents);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  function openModal() {
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDocumentType(DOCUMENT_TYPES[0].value);
    setError("");
    setSuccess("");
  }

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("document_type", documentType);
      const response = await fetch(`/api/pets/${petId}/documents`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load();
      setSuccess(`"${file.name}" uploaded as ${documentTypeLabel(documentType)}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not upload this file.");
    } finally {
      setUploading(false);
    }
  }

  async function confirmRemove() {
    if (!pendingDeleteId) return;
    const documentId = pendingDeleteId;
    setPendingDeleteId(null);
    const response = await fetch(`/api/pets/${petId}/documents/${documentId}`, { method: "DELETE" });
    if (response.ok) setDocuments((current) => current?.filter((document) => document.id !== documentId) || null);
    else setError("Could not delete this document.");
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-stone-900">Documents</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">Vet records, care instructions, or other files kept with this profile.</p>
        </div>
        <button
          type="button"
          aria-label="Upload a document"
          onClick={openModal}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-lg font-semibold text-white transition hover:bg-teal-800"
        >
          +
        </button>
      </div>

      <div className="space-y-1.5">
        {documents === null && <p className="text-sm text-stone-500">Loading documents…</p>}
        {documents?.length === 0 && <p className="text-sm text-stone-500">No documents added yet.</p>}
        {documents?.map((document) => (
          <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50">
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{document.file_name}</p>
              <p className="text-xs text-stone-500">
                {[documentTypeLabel(document.document_type), new Date(document.created_at).toLocaleDateString()].filter(Boolean).join(" • ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <a href={`/api/pets/${petId}/documents/${document.id}/download`} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary" className="min-h-8 px-3 text-xs">View</Button>
              </a>
              <Button type="button" variant="danger" className="min-h-8 px-3 text-xs" onClick={() => setPendingDeleteId(document.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && !modalOpen && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this document?"
        description="This cannot be undone. The file and its search data will be removed."
        onConfirm={confirmRemove}
        onCancel={() => setPendingDeleteId(null)}
      />

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upload a document"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-semibold text-stone-900">Upload a document</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Vet records, care instructions, insurance papers, or anything else worth keeping with this profile.
                </p>
              </div>
              <button type="button" aria-label="Close" onClick={closeModal} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                ✕
              </button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-800">Type</span>
              <div className="relative">
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-stone-300 bg-white py-2.5 pl-4 pr-10 text-sm text-stone-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400">▾</span>
              </div>
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-800">File</span>
              <input
                aria-label="Upload a document"
                type="file"
                accept=".pdf,.txt,.md,.csv,.doc,.docx,image/*"
                disabled={uploading}
                onChange={(event) => upload(event.target.files?.[0])}
                className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 hover:file:bg-teal-100"
              />
            </label>
            <p className="mt-3 text-xs text-stone-500">Up to 10 MB. Files stay attached to this profile until you remove them.</p>

            {uploading && <p className="mt-3 text-sm font-medium text-teal-700">Uploading…</p>}
            {success && <p role="status" className="mt-3 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">✓ {success}</p>}
            {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

            <div className="mt-5 flex justify-end">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={uploading}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
