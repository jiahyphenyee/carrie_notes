"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

type Source = { source_type: string; source_label: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

type Props = { shareToken: string; petName: string };

function sessionStorageKey(shareToken: string) {
  return `care-chat-session-${shareToken}`;
}

export function CareChat({ shareToken, petName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [caregiverLabel, setCaregiverLabel] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(window.localStorage.getItem(sessionStorageKey(shareToken)));
  }, [shareToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const asked = question.trim();
    if (!asked || sending) return;
    setSending(true);
    setError("");
    setQuestion("");
    setMessages((current) => [...current, { role: "user", content: asked }]);

    try {
      const response = await fetch(`/api/care/${shareToken}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, session_id: sessionId, caregiver_label: caregiverLabel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not get an answer.");
      setMessages((current) => [...current, { role: "assistant", content: data.answer, sources: data.sources }]);
      if (data.session_id) {
        setSessionId(data.session_id);
        window.localStorage.setItem(sessionStorageKey(shareToken), data.session_id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not get an answer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold text-stone-900">Ask about {petName}</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Answers are grounded in {petName}&apos;s saved profile and documents only.
        </p>
      </div>

      {!sessionId && (
        <input
          type="text"
          value={caregiverLabel}
          onChange={(event) => setCaregiverLabel(event.target.value)}
          placeholder="Your name (optional)"
          className="mb-3 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      )}

      {(messages.length > 0 || sending) && (
        <div ref={scrollRef} className="mb-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-6 ${
                  message.role === "user" ? "bg-teal-700 text-white" : "bg-stone-50 text-stone-800"
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.sources.map((source) => (
                      <span
                        key={`${source.source_type}:${source.source_label}`}
                        className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600"
                      >
                        {source.source_label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl bg-stone-50 px-4 py-2.5 text-sm italic leading-6 text-stone-500">
                Carrie is thinking…
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={`Ask anything about ${petName}'s care...`}
          rows={1}
          className="min-h-11 flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <Button type="button" disabled={sending || !question.trim()} onClick={send}>
          {sending ? "Asking…" : "Ask"}
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
    </section>
  );
}
