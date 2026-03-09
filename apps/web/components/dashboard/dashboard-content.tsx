"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, Skull, Users, Swords, Zap, CheckCircle, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getNextDailyReset, getNextWeeklyReset, formatTimeRemaining, getCurrentDailyPeriod, getCurrentWeeklyPeriod } from "@/lib/timers";
import type { Character, ProgressionItem, Activity, ActivityCompletion, Boss } from "@/lib/types";

interface DashboardContentProps {
  characters: Character[];
  progressionItems: ProgressionItem[];
  activities: Activity[];
  bosses: Boss[];
  activityCompletions: ActivityCompletion[];
}

export function DashboardContent({
  characters,
  progressionItems,
  activities,
  bosses,
  activityCompletions,
}: DashboardContentProps) {
  const [dailyCountdown, setDailyCountdown] = useState("");
  const [weeklyCountdown, setWeeklyCountdown] = useState("");
  const [loadingBossId, setLoadingBossId] = useState<string | null>(null);
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    function updateTimers() {
      const now = new Date();
      setDailyCountdown(formatTimeRemaining(getNextDailyReset(now), now));
      setWeeklyCountdown(formatTimeRemaining(getNextWeeklyReset(now), now));
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
      router.refresh();
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
      router.refresh();
    } finally {
      setLoadingActivityId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{mainChar ? `, ${mainChar.name}` : ""}
        </p>
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
    </div>
  );
}
