"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, TextField } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
    const { error: authError } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    setLoading(false);
    if (authError) setError(authError.message); else setSent(true);
  }
  return <main className="grid min-h-screen place-items-center bg-[#f6f4ef] px-5"><section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-xl shadow-stone-900/5 sm:p-9"><div className="mb-8"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-teal-800 text-xl text-white">✦</div><h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">Welcome to Carrie Notes</h1><p className="mt-3 leading-6 text-stone-600">Create a clear care profile, so the people helping with your pet have what they need.</p></div>{sent ? <div className="rounded-2xl bg-teal-50 p-5 text-sm leading-6 text-teal-900"><strong className="block text-base">Check your inbox</strong><p className="mt-1">We sent a secure sign-in link to <span className="font-semibold">{email}</span>.</p><button className="mt-4 font-semibold underline underline-offset-4" onClick={() => setSent(false)}>Use a different email</button></div> : <form onSubmit={signIn} className="space-y-5"><TextField label="Email address" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)}/>{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<Button className="w-full" type="submit" disabled={loading}>{loading ? "Sending link…" : "Email me a magic link"}</Button><p className="text-center text-xs leading-5 text-stone-500">No password to remember. The link securely signs you in.</p></form>}</section></main>;
}
