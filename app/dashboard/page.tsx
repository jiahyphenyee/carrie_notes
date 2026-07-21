"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PetCard } from "@/components/pet-card";

type PetSummary = { id: string; name: string; nickname?: string | null; breed?: string | null; age?: string | null };
export default function DashboardPage() {
  const [pets, setPets] = useState<PetSummary[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/pets").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setPets(data.pets); }).catch((cause) => setError(cause.message)); }, []);
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Your care profiles</p><h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950">Pets, thoughtfully prepared.</h1><p className="mt-3 max-w-xl text-stone-600">Keep the everyday details in one calm, shareable place.</p></div><Link href="/dashboard/pets/new"><Button>+ Add a pet</Button></Link></div>{error && <p className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>}{pets === null && !error && <p className="text-stone-600">Loading your pets…</p>}{pets?.length === 0 && <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center"><div className="text-4xl">🐾</div><h2 className="mt-4 font-serif text-2xl font-semibold text-stone-900">Start with one pet</h2><p className="mx-auto mt-2 max-w-md text-stone-600">Add their basics now, then fill in care details at your own pace.</p><Link className="mt-6 inline-block" href="/dashboard/pets/new"><Button>Add your first pet</Button></Link></div>}{pets && pets.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pets.map((pet) => <PetCard key={pet.id} pet={pet}/>)}</div>}</main>;
}
