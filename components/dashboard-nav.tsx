"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function DashboardNav({ email }: { email?: string }) {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return <header className="border-b border-stone-200 bg-[#fffdf9]"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><Link href="/dashboard" className="font-serif text-xl font-bold tracking-tight text-teal-900">Carrie Notes<span className="ml-1 text-teal-500">✦</span></Link><div className="flex items-center gap-3"><span className="hidden text-sm text-stone-500 sm:block">{email}</span><Button variant="ghost" className="min-h-9 px-3" onClick={logout}>Log out</Button></div></div></header>;
}
