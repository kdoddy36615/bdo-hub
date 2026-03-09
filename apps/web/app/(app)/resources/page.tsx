import { createClient } from "@/lib/supabase/server";
import { ResourcesContent } from "./resources-content";

export default async function ResourcesPage() {
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return <ResourcesContent resources={resources ?? []} />;
}
