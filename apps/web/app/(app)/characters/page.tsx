import { createClient } from "@/lib/supabase/server";
import { CharactersContent } from "./characters-content";

export default async function CharactersPage() {
  const supabase = await createClient();

  const [
    { data: characters },
    { data: tags },
  ] = await Promise.all([
    supabase.from("characters").select("*").order("is_main", { ascending: false }).order("level", { ascending: false }),
    supabase.from("character_tags").select("*, main:characters!main_character_id(name, class_name), tagged:characters!tagged_character_id(name, class_name)"),
  ]);

  return <CharactersContent characters={characters ?? []} tags={tags ?? []} />;
}
