"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSupabaseFetch } from "@/lib/hooks/use-supabase-fetch";
import { PageSkeleton } from "@/components/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, UserPlus, CheckCircle, MapPin, XCircle, Trash2, Ghost, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BOSS_PRIORITY_COLORS } from "@/lib/constants";
import type { Boss, BossHistory } from "@/lib/types";

/**
 * Calculate the next spawn time for a boss based on its schedule.
 * Times in schedule are EST. Returns null if no schedule.
 */
function getNextSpawn(boss: Boss, now: Date): Date | null {
  if (!boss.spawn_schedule || boss.spawn_schedule.length === 0) return null;

  const candidates: Date[] = [];

  for (const window of boss.spawn_schedule) {
    for (const timeStr of window.times) {
      const [hour, minute] = timeStr.split(":").map(Number);

      // Check today and next 7 days
      for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
        const candidate = new Date(now);
        candidate.setDate(candidate.getDate() + dayOffset);

        // Set time in EST by using toLocaleString trick
        const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const utcNow = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
        const estOffsetMs = utcNow.getTime() - estNow.getTime();

        // Build candidate in EST then convert to UTC
        const estCandidate = new Date(candidate);
        estCandidate.setHours(hour, minute, 0, 0);
        const utcCandidate = new Date(estCandidate.getTime() + estOffsetMs);

        // Check if the day of week (in EST) matches
        const estDay = new Date(utcCandidate.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const dayOfWeek = estDay.getDay();

        if (window.days.includes(dayOfWeek) && utcCandidate.getTime() > now.getTime()) {
          candidates.push(utcCandidate);
        }
      }
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

function formatSpawnCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Now!";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatSpawnTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

interface BossAltWithChar {
  id: string;
  boss_id: string;
  character_id: string;
  characters: { name: string; class_name: string } | null;
}

export function BossesContent() {
  const { data, loading, refetch } = useSupabaseFetch(
    async (supabase) => {
      const [b, ba, c, h] = await Promise.all([
        supabase.from("bosses").select("*").order("priority"),
        supabase.from("boss_alts").select("*, characters(name, class_name)"),
        supabase.from("characters").select("id, name, class_name, level"),
        supabase.from("boss_history").select("*").order("date", { ascending: false }).limit(50),
      ]);
      return {
        bosses: b.data ?? [] as Boss[],
        bossAlts: (ba.data as BossAltWithChar[]) ?? [],
        characters: c.data ?? [] as { id: string; name: string; class_name: string; level: number }[],
        history: h.data ?? [] as BossHistory[],
      };
    },
    { bosses: [] as Boss[], bossAlts: [] as BossAltWithChar[], characters: [] as { id: string; name: string; class_name: string; level: number }[], history: [] as BossHistory[] }
  );
  const { bosses, bossAlts, characters, history } = data;
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [spawnTimers, setSpawnTimers] = useState<Record<string, { countdown: string; time: string } | null>>({});

  useEffect(() => {
    function updateSpawnTimers() {
      const now = new Date();
      const timers: Record<string, { countdown: string; time: string } | null> = {};
      for (const boss of bosses) {
        const nextSpawn = getNextSpawn(boss, now);
        if (nextSpawn) {
          timers[boss.id] = {
            countdown: formatSpawnCountdown(nextSpawn, now),
            time: formatSpawnTime(nextSpawn),
          };
        } else {
          timers[boss.id] = null;
        }
      }
      setSpawnTimers(timers);
    }

    updateSpawnTimers();
    const interval = setInterval(updateSpawnTimers, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [bosses]);

  async function assignAlt(bossId: string, characterId: string) {
    const supabase = createClient();
    const boss = bosses.find((b) => b.id === bossId);
    const character = characters.find((c) => c.id === characterId);
    const { error } = await supabase.from("boss_alts").upsert({
      boss_id: bossId,
      character_id: characterId,
    });
    setAssignOpen(null);
    if (error) {
      toast.error("Failed to assign alt");
    } else {
      toast.success(
        `Assigned ${character?.name ?? "character"} to ${boss?.name ?? "boss"}`
      );
    }
    refetch();
  }

  async function logAttendance(bossId: string, attended: boolean) {
    const supabase = createClient();
    const boss = bosses.find((b) => b.id === bossId);
    const { error } = await supabase.from("boss_history").insert({
      boss_id: bossId,
      attended,
    });
    if (error) {
      toast.error(`Failed to log ${attended ? "kill" : "miss"}`);
    } else if (attended) {
      toast.success(`Kill logged for ${boss?.name ?? "boss"}`);
    } else {
      toast("Missed boss recorded", {
        description: boss?.name ?? "boss",
      });
    }
    refetch();
  }

  async function deleteHistoryEntry(entryId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("boss_history")
      .delete()
      .eq("id", entryId);
    if (error) {
      toast.error("Failed to delete history entry");
    } else {
      toast.success("History entry deleted");
    }
    refetch();
  }

  function getAltForBoss(bossId: string) {
    return bossAlts.find((a) => a.boss_id === bossId);
  }

  function getHistoryCount(bossId: string) {
    return history.filter((h) => h.boss_id === bossId && h.attended).length;
  }

  function getMissedCount(bossId: string) {
    return history.filter((h) => h.boss_id === bossId && !h.attended).length;
  }

  const priorityGroups = {
    high: bosses.filter((b) => b.priority === "high"),
    medium: bosses.filter((b) => b.priority === "medium"),
    low: bosses.filter((b) => b.priority === "low"),
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Boss Tracker</h1>
        <p className="text-muted-foreground">Track world boss spawns and attendance</p>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          {(["high", "medium", "low"] as const).map((priority) => (
            <div key={priority}>
              <h2 className={`mb-3 text-lg font-semibold capitalize ${BOSS_PRIORITY_COLORS[priority]}`}>
                {priority} Priority
              </h2>
              {priorityGroups[priority].length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Ghost className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No {priority} priority bosses configured yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {priorityGroups[priority].map((boss) => {
                    const alt = getAltForBoss(boss.id);
                    const killCount = getHistoryCount(boss.id);
                    const missedCount = getMissedCount(boss.id);
                    const spawnInfo = spawnTimers[boss.id];

                    return (
                      <Card key={boss.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Skull className="h-4 w-4" />
                              {boss.name}
                            </CardTitle>
                            <Badge variant={priority === "high" ? "destructive" : "secondary"}>
                              {priority}
                            </Badge>
                          </div>
                          {boss.location && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {boss.location}
                              </span>
                            </div>
                          )}
                          {spawnInfo && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <Timer className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm font-semibold text-primary">
                                {spawnInfo.countdown}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({spawnInfo.time} EST)
                              </span>
                            </div>
                          )}
                          {boss.notes && (
                            <CardDescription>{boss.notes}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {boss.notable_drops.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {boss.notable_drops.map((drop: string) => (
                                <Badge key={drop} variant="outline" className="text-xs">{drop}</Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Alt: {alt?.characters ? `${alt.characters.name} (${alt.characters.class_name})` : "None"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{killCount} kills</span>
                              {missedCount > 0 && (
                                <span className="text-muted-foreground/60">{missedCount} missed</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Dialog open={assignOpen === boss.id} onOpenChange={(o) => setAssignOpen(o ? boss.id : null)}>
                              <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1" />}>
                                  <UserPlus className="mr-1 h-3 w-3" />Assign Alt
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Character to {boss.name}</DialogTitle>
                                </DialogHeader>
                                {characters.length === 0 ? (
                                  <p className="py-4 text-center text-sm text-muted-foreground">
                                    No characters found. Add a character first.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    <Label>Character</Label>
                                    <Select onValueChange={(v: string | null) => { if (v) assignAlt(boss.id, v); }}>
                                      <SelectTrigger><SelectValue placeholder="Select character" /></SelectTrigger>
                                      <SelectContent>
                                        {characters.map((c) => (
                                          <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.class_name}) - Lv.{c.level}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" className="flex-1" onClick={() => logAttendance(boss.id, true)}>
                              <CheckCircle className="mr-1 h-3 w-3" />Log Kill
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => logAttendance(boss.id, false)}
                            >
                              <XCircle className="mr-1 h-3 w-3" />Missed
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-2">
          {history.length > 0 ? (
            history.map((h) => {
              const boss = bosses.find((b) => b.id === h.boss_id);
              return (
                <Card key={h.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="font-medium">{boss?.name ?? "Unknown"}</p>
                      {boss?.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {boss.location}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {new Date(h.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.drops && <Badge variant="outline">{h.drops}</Badge>}
                      <Badge variant={h.attended ? "default" : "secondary"}>
                        {h.attended ? "Attended" : "Missed"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteHistoryEntry(h.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete entry</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Skull className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No boss history yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Start logging kills and missed bosses from the Schedule tab.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
