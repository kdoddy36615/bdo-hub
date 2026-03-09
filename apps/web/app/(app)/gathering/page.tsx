import { createClient } from "@/lib/supabase/server";
import { GatheringContent } from "./gathering-content";

export default async function GatheringPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("gathering_items")
    .select("*")
    .order("category")
    .order("name");

  return <GatheringContent items={items ?? []} />;
}
