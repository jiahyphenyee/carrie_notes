"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PetForm } from "@/components/pet-form";
import type { PetFormValues } from "@/lib/pets";

export default function EditPetPage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const [pet, setPet] = useState<PetFormValues | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/pets/${params.id}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setPet(data.pet); }).catch((cause) => setError(cause.message)); }, [params.id]);
  async function save(values: PetFormValues) { const response = await fetch(`/api/pets/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); router.replace(`/dashboard/pets/${params.id}`); }
  if (error) return <main className="mx-auto max-w-3xl px-5 py-10"><p className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p></main>; if (!pet) return <main className="mx-auto max-w-3xl px-5 py-10 text-stone-600">Loading profile…</main>;
  return <main className="mx-auto max-w-3xl px-5 py-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Edit care profile</p><h1 className="mt-2 mb-8 font-serif text-4xl font-semibold tracking-tight text-stone-950">Keep it up to date</h1><PetForm initialValues={pet} submitLabel="Save changes" onSave={save}/></main>;
}
