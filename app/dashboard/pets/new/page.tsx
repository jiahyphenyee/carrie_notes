"use client";

import { useRouter } from "next/navigation";
import { PetForm } from "@/components/pet-form";
import type { PetFormValues } from "@/lib/pets";

export default function NewPetPage() {
  const router = useRouter();
  async function createPet(values: PetFormValues) { const response = await fetch("/api/pets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); router.replace(`/dashboard/pets/${data.id}`); }
  return <main className="mx-auto max-w-3xl px-5 py-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">New care profile</p><h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-stone-950">Tell us about your pet</h1><p className="mt-3 mb-8 text-stone-600">The essentials first. You can keep going tab by tab or come back later.</p><PetForm submitLabel="Create care profile" onSave={createPet}/></main>;
}
