import Link from "next/link";

export function PetCard({ pet }: { pet: { id: string; name: string; nickname?: string | null; breed?: string | null; age?: string | null } }) {
  return <Link href={`/dashboard/pets/${pet.id}`} className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">🐾</div><h2 className="font-serif text-xl font-semibold text-stone-900 group-hover:text-teal-800">{pet.name}</h2><p className="mt-1 text-sm text-stone-600">{[pet.nickname && `“${pet.nickname}”`, pet.breed, pet.age].filter(Boolean).join(" · ") || "Care profile"}</p><span className="mt-5 inline-block text-sm font-semibold text-teal-700">View profile →</span></Link>;
}
