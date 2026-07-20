import { createClient } from "@/lib/supabase/server";
import MenageManager from "./menage-manager";

export default async function MenagePage() {
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("staff_members")
    .select("*")
    .order("created_at", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);

  const { data: tasks } = await supabase
    .from("cleaning_tasks")
    .select("*, staff_members(name)")
    .gte("task_date", today)
    .lte("task_date", weekOut)
    .order("task_date", { ascending: true })
    .order("start_time", { ascending: true });

  return <MenageManager initialStaff={staff ?? []} initialTasks={tasks ?? []} />;
}
