import { DashboardNav } from "@/components/dashboard-nav";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen bg-[#f6f4ef]"><DashboardNav email={user?.email}/>{children}</div>;
}
