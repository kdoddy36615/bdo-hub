import { createClient } from "@/lib/supabase/server";
import { PlaybooksContent } from "./playbooks-content";

export default async function PlaybooksPage() {
  const supabase = await createClient();

  const { data: playbooks } = await supabase
    .from("playbooks")
    .select("*, playbook_steps(*)")
    .order("created_at", { ascending: false });

  return <PlaybooksContent playbooks={playbooks ?? []} />;
}
