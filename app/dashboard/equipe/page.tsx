import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EquipeManager from "./equipe-manager";

export default async function EquipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "owner") redirect("/dashboard");

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("role", { ascending: true });

  const { data: invites } = await supabase
    .from("establishment_invites")
    .select("id, email, role, accepted_at, created_at")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  return <EquipeManager initialMembers={members ?? []} initialInvites={invites ?? []} currentUserId={user?.id ?? ""} />;
}
