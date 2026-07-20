import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, establishments(name)")
    .eq("id", user.id)
    .single();

  const establishmentName = (profile?.establishments as unknown as { name: string } | null)?.name ?? "";

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <header className="bg-[#1A2B4B] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="font-black text-lg text-white">
              anex<span className="text-[#2473BA]">o</span>
            </div>
            {establishmentName && (
              <span className="text-xs text-[#AEB9CC] border-l border-white/20 pl-3">{establishmentName}</span>
            )}
          </div>
          <nav className="flex gap-1 p-1 rounded-xl bg-white/10">
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-white/10">
              Accueil
            </Link>
            <Link href="/dashboard/annexes" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-white/10">
              Rubriques
            </Link>
            <Link href="/dashboard/menage" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-white/10">
              Ménage
            </Link>
            <Link href="/dashboard/finance" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-white/10">
              Finance
            </Link>
            <Link href="/dashboard/equipe" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-white/10">
              Équipe
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#AEB9CC]">{profile?.full_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
