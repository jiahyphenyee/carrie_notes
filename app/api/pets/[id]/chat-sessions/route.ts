import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { NextResponse } from "next/server";

type Context = { params: { id: string } };

export async function GET(_: Request, { params }: Context) {
  const supabase = await createAuthServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*, chat_messages(*)")
    .eq("pet_id", params.id)
    .order("created_at", { ascending: false })
    .order("created_at", { ascending: true, foreignTable: "chat_messages" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: data || [] });
}
