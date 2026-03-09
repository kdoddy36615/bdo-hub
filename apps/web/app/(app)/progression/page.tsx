import { createClient } from "@/lib/supabase/server";
import { ProgressionContent } from "./progression-content";

export default async function ProgressionPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("progression_items")
    .select("*")
    .order("sort_order");

  return <ProgressionContent items={items ?? []} />;
}
