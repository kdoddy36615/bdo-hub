import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .single();

  return (
    <SettingsContent
      email={user?.email ?? ""}
      settings={settings}
      profile={profile}
    />
  );
}
