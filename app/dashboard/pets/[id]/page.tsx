"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PetProfileView } from "@/components/pet-profile-view";
import { ShareLinkCard } from "@/components/share-link-card";
import { Button } from "@/components/ui";
import type { PetRecord } from "@/lib/pets";

export default function PetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pet, setPet] = useState<PetRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/pets/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPet(data.pet);
      })
      .catch((cause) => setError(cause.message));
  }, [params.id]);

  async function remove() {
    if (!window.confirm(`Delete ${pet?.name}'s care profile? This cannot be undone.`)) return;
    const response = await fetch(`/api/pets/${params.id}`, { method: "DELETE" });
    if (response.ok) router.replace("/dashboard");
    else setError("Could not delete this profile.");
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>
      </main>
    );
  }

  if (!pet) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 text-stone-600">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-amber-100 text-4xl">🐾</div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Care profile</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950">{pet.name}</h1>
            <p className="mt-1 text-stone-600">{[pet.breed, pet.age].filter(Boolean).join(" · ") || "Details ready when you are."}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/pets/${pet.id}/edit`}>
            <Button>Edit profile</Button>
          </Link>
          <Button variant="ghost" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <ShareLinkCard shareToken={pet.share_token} />
        <PetProfileView pet={pet} />
      </div>
    </main>
  );
}
