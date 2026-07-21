"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type ChatMessage = { id: string; role: string; content: string; created_at: string };
type ChatSession = { id: string; caregiver_label: string | null; created_at: string; chat_messages: ChatMessage[] };

type Props = { petId: string };

export function ChatHistory({ petId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[] | null>(null);
  const [error, setError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  async function open() {
    setModalOpen(true);
    setSelectedSessionId(null);
    setError("");
    const response = await fetch(`/api/pets/${petId}/chat-sessions`);
    const data = await response.json();
    if (response.ok) setSessions(data.sessions);
    else setError("Could not load caregiver questions.");
  }

  const selectedSession = sessions?.find((session) => session.id === selectedSessionId) || null;

  return (
    <>
      <Button type="button" variant="secondary" onClick={open}>Caregiver questions</Button>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Caregiver questions"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                {selectedSession ? (
                  <button type="button" onClick={() => setSelectedSessionId(null)} className="mb-1 text-sm font-semibold text-teal-700 hover:underline">
                    ← Back to all questions
                  </button>
                ) : (
                  <h3 className="font-serif text-xl font-semibold text-stone-900">Caregiver questions</h3>
                )}
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {selectedSession
                    ? `${selectedSession.caregiver_label || "Anonymous caregiver"} · ${new Date(selectedSession.created_at).toLocaleString()}`
                    : "Conversations caregivers have had with Carrie about this profile."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
            {!error && sessions === null && <p className="text-sm text-stone-500">Loading…</p>}
            {!error && sessions?.length === 0 && <p className="text-sm text-stone-500">No caregiver questions yet.</p>}

            {!selectedSession && (
              <div className="space-y-2">
                {sessions?.map((session) => {
                  const firstQuestion = session.chat_messages.find((message) => message.role === "user")?.content;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className="block w-full rounded-xl border border-stone-200 p-4 text-left transition hover:border-teal-300 hover:bg-stone-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-stone-900">{session.caregiver_label || "Anonymous caregiver"}</p>
                        <span className="shrink-0 text-xs text-stone-500">{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-stone-600">{firstQuestion || "No messages yet."}</p>
                      <p className="mt-1 text-xs text-stone-400">{session.chat_messages.length} message{session.chat_messages.length === 1 ? "" : "s"}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSession && (
              <div className="space-y-2 text-sm leading-6">
                {selectedSession.chat_messages.map((message) => (
                  <p key={message.id} className={message.role === "user" ? "text-stone-900" : "text-stone-600"}>
                    <span className="font-semibold">{message.role === "user" ? "Caregiver: " : "Carrie: "}</span>
                    {message.content}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
