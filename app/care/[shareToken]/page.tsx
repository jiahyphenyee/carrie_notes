"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CareChat } from "@/components/care-chat";
import { PetProfileView } from "@/components/pet-profile-view";
import type { PetRecord } from "@/lib/pets";

export default function CareSharePage() {
  const params = useParams<{ shareToken: string }>();
  const [pet, setPet] = useState<PetRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/care/${params.shareToken}`)
      .then(async (response) => {
        if (!response.ok) {
          setNotFound(true);
          return;
        }
        const data = await response.json();
        setPet(data.pet);
      })
      .catch(() => setNotFound(true));
  }, [params.shareToken]);

  if (notFound) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="rounded-xl bg-rose-50 p-4 text-rose-800">
          This link isn&apos;t valid or the profile is no longer shared.
        </p>
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
      <div className="mb-9 flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-amber-100 text-4xl">🐾</div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
            Shared care profile · read-only
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950">{pet.name}</h1>
          <p className="mt-1 text-stone-600">
            {[pet.breed, pet.age].filter(Boolean).join(" · ") || "Details ready when you are."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CareChat shareToken={params.shareToken} petName={pet.name} />
        <PetProfileView pet={pet} />
      </div>
    </main>
  );
}
