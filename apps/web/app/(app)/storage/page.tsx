import { createClient } from "@/lib/supabase/server";
import { StorageContent } from "./storage-content";

export default async function StoragePage() {
  const supabase = await createClient();

  const { data: tabs } = await supabase
    .from("storage_tabs")
    .select("*")
    .order("tab_number");

  return <StorageContent tabs={tabs ?? []} />;
}
