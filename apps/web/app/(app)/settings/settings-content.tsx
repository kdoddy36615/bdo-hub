"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { UserSettings, Profile } from "@/lib/types";

export function SettingsContent() {
  const [email, setEmail] = useState("");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("user_settings").select("*").single(),
      supabase.from("profiles").select("*").single(),
    ]).then(([userRes, settingsRes, profileRes]) => {
      setEmail(userRes.data.user?.email ?? "");
      setSettings(settingsRes.data);
      setProfile(profileRes.data);
      setLoading(false);
    });
  }, []);

  async function handleSave(formData: FormData) {
    setSaving(true);
    const supabase = createClient();

    try {
      const settingsData = {
        timezone: formData.get("timezone") as string,
        daily_reset_time: formData.get("daily_reset_time") as string,
        weekly_reset_day: parseInt(formData.get("weekly_reset_day") as string),
        theme,
      };

      // Upsert pattern: always use upsert so it works whether or not a row exists
      const { error: settingsError } = settings
        ? await supabase
            .from("user_settings")
            .update(settingsData)
            .eq("id", settings.id)
        : await supabase
            .from("user_settings")
            .upsert(settingsData, { onConflict: "user_id" });

      if (settingsError) {
        toast.error("Failed to save settings: " + settingsError.message);
        setSaving(false);
        return;
      }

      const displayName = formData.get("display_name") as string;
      if (profile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", profile.id);

        if (profileError) {
          toast.error("Failed to update profile: " + profileError.message);
          setSaving(false);
          return;
        }
      }

      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your BDO Command Center</p>
      </div>

      <form action={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
            <CardDescription>BDO server and reset configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select name="timezone" defaultValue={settings?.timezone ?? "America/New_York"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern (EST/EDT)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CST/CDT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MST/MDT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PST/PDT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily_reset_time">Daily Reset Time</Label>
                <Input
                  id="daily_reset_time"
                  name="daily_reset_time"
                  type="time"
                  defaultValue={settings?.daily_reset_time ?? "19:00"}
                />
              </div>
              <div className="space-y-2">
                <Label>Weekly Reset Day</Label>
                <Select name="weekly_reset_day" defaultValue={String(settings?.weekly_reset_day ?? 3)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Currently using {theme} mode
                </p>
              </div>
              <Button type="button" variant="outline" onClick={toggleTheme}>
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
