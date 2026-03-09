import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: characters },
    { data: progressionItems },
    { data: activities },
    { data: bosses },
    { data: activityCompletions },
  ] = await Promise.all([
    supabase.from("characters").select("*").order("is_main", { ascending: false }),
    supabase.from("progression_items").select("*").order("sort_order"),
    supabase.from("activities").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("bosses").select("*").order("priority"),
    supabase.from("activity_completions").select("*"),
  ]);

  return (
    <DashboardContent
      characters={characters ?? []}
      progressionItems={progressionItems ?? []}
      activities={activities ?? []}
      bosses={bosses ?? []}
      activityCompletions={activityCompletions ?? []}
    />
  );
}
