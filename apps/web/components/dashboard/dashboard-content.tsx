"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Skull, Users, Swords, Zap, CheckCircle, CalendarCheck, Printer, ExternalLink, Globe, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getNextDailyReset, getNextWeeklyReset, formatTimeRemaining, getCurrentDailyPeriod, getCurrentWeeklyPeriod } from "@/lib/timers";
import { RESET_TIMES } from "@/lib/constants";
import { useSupabaseFetch } from "@/lib/hooks/use-supabase-fetch";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Character, ProgressionItem, Activity, ActivityCompletion, Boss } from "@/lib/types";

const BDO_LINKS = [
  { name: "BDO Official News", url: "https://www.naeu.playblackdesert.com/en-US/News/Notice", description: "Patch notes & announcements" },
  { name: "Garmoth Gear Planner", url: "https://garmoth.com/gear-planner", description: "Plan and optimize your gear builds" },
  { name: "Garmoth Grind Tracker", url: "https://garmoth.com/grind-tracker", description: "Track grind sessions and silver/hr" },
  { name: "Garmoth Market", url: "https://garmoth.com/market", description: "Market prices and alerts" },
  { name: "BDO Codex", url: "https://bdocodex.com", description: "Item & quest database" },
  { name: "GrumpyGreenCricket", url: "https://grumpygreen.cricket/bdo-guide/", description: "Guides & walkthroughs" },
  { name: "BDO Planner", url: "https://bdoplanner.com", description: "Gear calculator" },
] as const;

/**
 * Check if BDO maintenance is likely in progress.
 * Maintenance typically runs Wednesday ~11pm EST for about 4 hours.
 * Returns status info with whether maintenance is active and a message.
 */
function getMaintenanceStatus(now: Date): { active: boolean; message: string } {
  // Get current time in ET
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etString);
  const dayOfWeek = etDate.getDay(); // 0=Sun, 3=Wed
  const hour = etDate.getHours();

  // Wednesday (day 3) starting at 11pm (hour 23) => maintenance window
  // Thursday (day 4) until ~3am (hour 3) => maintenance window
  const isWednesdayLate = dayOfWeek === RESET_TIMES.maintenance.day && hour >= RESET_TIMES.maintenance.hour;
  const isThursdayEarly = dayOfWeek === 4 && hour < 3;

  if (isWednesdayLate || isThursdayEarly) {
    return { active: true, message: "Maintenance likely in progress" };
  }

  // Calculate time until next Wednesday 11pm ET
  let daysUntilWed = (RESET_TIMES.maintenance.day - dayOfWeek + 7) % 7;
  if (daysUntilWed === 0 && hour < RESET_TIMES.maintenance.hour) {
    daysUntilWed = 0; // It's Wednesday but before maintenance
  } else if (daysUntilWed === 0) {
    daysUntilWed = 7; // It's Wednesday after maintenance passed
  }

  if (daysUntilWed === 0) {
    const hoursUntil = RESET_TIMES.maintenance.hour - hour;
    return { active: false, message: `Maintenance in ~${hoursUntil}h (tonight)` };
  }

  if (daysUntilWed === 1) {
    return { active: false, message: "Maintenance tomorrow (Wed 11pm EST)" };
  }

  return { active: false, message: `Next maintenance in ${daysUntilWed} days (Wed 11pm EST)` };
}

export function DashboardContent() {
  const { data, loading, refetch } = useSupabaseFetch(
    async (supabase) => {
      const [c, p, a, b, ac] = await Promise.all([
        supabase.from("characters").select("*").order("is_main", { ascending: false }),
        supabase.from("progression_items").select("*").order("sort_order"),
        supabase.from("activities").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("bosses").select("*").order("priority"),
        supabase.from("activity_completions").select("*"),
      ]);
      return {
        characters: (c.data ?? []) as Character[],
        progressionItems: (p.data ?? []) as ProgressionItem[],
        activities: (a.data ?? []) as Activity[],
        bosses: (b.data ?? []) as Boss[],
        activityCompletions: (ac.data ?? []) as ActivityCompletion[],
      };
    },
    { characters: [], progressionItems: [], activities: [], bosses: [], activityCompletions: [] } as {
      characters: Character[];
      progressionItems: ProgressionItem[];
      activities: Activity[];
      bosses: Boss[];
      activityCompletions: ActivityCompletion[];
    }
  );

  const { characters, progressionItems, activities, bosses, activityCompletions } = data;

  const [dailyCountdown, setDailyCountdown] = useState("");
  const [weeklyCountdown, setWeeklyCountdown] = useState("");
  const [maintenanceStatus, setMaintenanceStatus] = useState(() => getMaintenanceStatus(new Date()));
  const [loadingBossId, setLoadingBossId] = useState<string | null>(null);
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null);

  useEffect(() => {
    function updateTimers() {
      const now = new Date();
      setDailyCountdown(formatTimeRemaining(getNextDailyReset(now), now));
      setWeeklyCountdown(formatTimeRemaining(getNextWeeklyReset(now), now));
      setMaintenanceStatus(getMaintenanceStatus(now));
    }

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  const mainChar = characters.find((c) => c.is_main);
  const completedItems = progressionItems.filter((i) => i.status === "completed").length;
  const totalItems = progressionItems.length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const highPriorityBosses = bosses.filter((b) => b.priority === "high");
  const topBosses = highPriorityBosses.slice(0, 3);

  // Daily activities that are not yet completed for the current period
  const dailyActivities = activities.filter((a) => a.category === "daily");

  function isActivityCompleted(activity: Activity): boolean {
    const period = activity.reset_type === "daily"
      ? getCurrentDailyPeriod()
      : getCurrentWeeklyPeriod();
    return activityCompletions.some(
      (c) => c.activity_id === activity.id && c.reset_period === period
    );
  }

  const uncompletedDailies = dailyActivities.filter((a) => !isActivityCompleted(a));
  const completedDailies = dailyActivities.filter((a) => isActivityCompleted(a));

  async function handleLogKill(boss: Boss) {
    setLoadingBossId(boss.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("boss_history").insert({
        boss_id: boss.id,
        attended: true,
      });
      if (error) {
        toast.error(`Failed to log kill for ${boss.name}`);
      } else {
        toast.success(`Kill logged for ${boss.name}`);
      }
      refetch();
    } finally {
      setLoadingBossId(null);
    }
  }

  async function handleToggleActivity(activity: Activity) {
    setLoadingActivityId(activity.id);
    try {
      const supabase = createClient();
      const period = activity.reset_type === "daily"
        ? getCurrentDailyPeriod()
        : getCurrentWeeklyPeriod();

      const existing = activityCompletions.find(
        (c) => c.activity_id === activity.id && c.reset_period === period
      );

      if (existing) {
        const { error } = await supabase
          .from("activity_completions")
          .delete()
          .eq("id", existing.id);
        if (error) {
          toast.error("Failed to update activity");
        } else {
          toast.success(`"${activity.name}" marked incomplete`);
        }
      } else {
        const { error } = await supabase.from("activity_completions").insert({
          activity_id: activity.id,
          reset_period: period,
        });
        if (error) {
          toast.error("Failed to complete activity");
        } else {
          toast.success(`"${activity.name}" completed`);
        }
      }
      refetch();
    } finally {
      setLoadingActivityId(null);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{mainChar ? `, ${mainChar.name}` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Printer className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gear Score</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mainChar ? mainChar.gear_score : "—"}
            </div>
            {mainChar && (
              <p className="text-xs text-muted-foreground">
                {mainChar.ap}/{mainChar.aap}/{mainChar.dp} AP/AAP/DP
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPct}%</div>
            <Progress value={progressPct} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {completedItems}/{totalItems} items complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Reset</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyCountdown || "..."}</div>
            <p className="text-xs text-muted-foreground">7:00 PM EST</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Reset</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyCountdown || "..."}</div>
            <p className="text-xs text-muted-foreground">Wednesday 7:00 PM EST</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Boss Kills
            </CardTitle>
            <CardDescription>Log kills for high-priority bosses</CardDescription>
          </CardHeader>
          <CardContent>
            {topBosses.length > 0 ? (
              <div className="space-y-2">
                {topBosses.map((boss) => (
                  <div
                    key={boss.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Skull className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{boss.name}</span>
                    </div>
                    <Button
                      size="sm"
                      disabled={loadingBossId === boss.id}
                      onClick={() => handleLogKill(boss)}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {loadingBossId === boss.id ? "Logging..." : "Log Kill"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No high-priority bosses configured.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Daily Activities
            </CardTitle>
            <CardDescription>
              {completedDailies.length}/{dailyActivities.length} completed today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyActivities.length > 0 ? (
              <div className="space-y-2">
                {dailyActivities.map((activity) => {
                  const completed = isActivityCompleted(activity);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Checkbox
                        checked={completed}
                        disabled={loadingActivityId === activity.id}
                        onCheckedChange={() => handleToggleActivity(activity)}
                      />
                      <span
                        className={`flex-1 text-sm font-medium ${
                          completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {activity.name}
                      </span>
                      {completed && (
                        <Badge variant="secondary" className="text-xs">Done</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No daily activities configured. Go to Activities to add some.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skull className="h-5 w-5" />
              High Priority Bosses
            </CardTitle>
            <CardDescription>Bosses you should attend</CardDescription>
          </CardHeader>
          <CardContent>
            {highPriorityBosses.length > 0 ? (
              <div className="space-y-2">
                {highPriorityBosses.map((boss) => (
                  <div key={boss.id} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="font-medium">{boss.name}</span>
                    <Badge variant="destructive">High</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No boss data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Characters
            </CardTitle>
            <CardDescription>{characters.length} characters</CardDescription>
          </CardHeader>
          <CardContent>
            {characters.length > 0 ? (
              <div className="space-y-2">
                {characters.slice(0, 5).map((char) => (
                  <div key={char.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <span className="font-medium">{char.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{char.class_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Lv. {char.level}</span>
                      {char.is_main && <Badge>Main</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No characters added yet. Go to Characters to add your first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BDO Links & Server Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              BDO Links
            </CardTitle>
            <CardDescription>Quick links to community resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {BDO_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <span className="font-medium">{link.name}</span>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Server Status
            </CardTitle>
            <CardDescription>Weekly maintenance schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex items-center gap-3 rounded-lg border p-4 ${
                maintenanceStatus.active
                  ? "border-yellow-500/50 bg-yellow-500/10"
                  : "border-green-500/50 bg-green-500/10"
              }`}>
                <div className={`h-3 w-3 rounded-full ${
                  maintenanceStatus.active
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-green-500"
                }`} />
                <div>
                  <p className="font-medium">
                    {maintenanceStatus.active ? "Maintenance Window" : "Servers Online"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceStatus.message}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Typical Schedule</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Wednesday 11:00 PM - Thursday ~3:00 AM EST
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actual times may vary. Check official announcements for exact schedule.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
