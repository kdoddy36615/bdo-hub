import { createClient } from "@/lib/supabase/server";
import { ActivitiesContent } from "./activities-content";

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const { data: completions } = await supabase
    .from("activity_completions")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(100);

  const { data: completionHistory } = await supabase
    .from("activity_completions")
    .select("*, activities(name, reset_type)")
    .order("completed_at", { ascending: false })
    .limit(50);

  return (
    <ActivitiesContent
      activities={activities ?? []}
      completions={completions ?? []}
      completionHistory={completionHistory ?? []}
    />
  );
}
