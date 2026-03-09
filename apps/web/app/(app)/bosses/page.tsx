import { createClient } from "@/lib/supabase/server";
import { BossesContent } from "./bosses-content";

export default async function BossesPage() {
  const supabase = await createClient();

  const [
    { data: bosses },
    { data: bossAlts },
    { data: characters },
    { data: history },
  ] = await Promise.all([
    supabase.from("bosses").select("*").order("priority"),
    supabase.from("boss_alts").select("*, characters(name, class_name)"),
    supabase.from("characters").select("id, name, class_name, level"),
    supabase.from("boss_history").select("*").order("date", { ascending: false }).limit(50),
  ]);

  return (
    <BossesContent
      bosses={bosses ?? []}
      bossAlts={bossAlts ?? []}
      characters={characters ?? []}
      history={history ?? []}
    />
  );
}
