"use client";

import { useEffect, useState } from "react";
import { useSupabaseFetch } from "@/lib/hooks/use-supabase-fetch";
import { PageSkeleton } from "@/components/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Plus, Clock, Trash2, CalendarCheck, ListChecks, History } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getNextDailyReset, getNextWeeklyReset, formatTimeRemaining, getCurrentDailyPeriod, getCurrentWeeklyPeriod } from "@/lib/timers";
import type { Activity, ActivityCompletion, ActivityCompletionWithActivity } from "@/lib/types";

type CategoryTab = "daily" | "weekly" | "event" | "other";

const TAB_CONFIG: { value: CategoryTab; label: string; badgeLabel: string }[] = [
  { value: "daily", label: "Dailies", badgeLabel: "Daily" },
  { value: "weekly", label: "Weeklies", badgeLabel: "Weekly" },
  { value: "event", label: "Events", badgeLabel: "Event" },
  { value: "other", label: "Other", badgeLabel: "Other" },
];

export function ActivitiesContent() {
  const { data, loading, refetch } = useSupabaseFetch(
    async (supabase) => {
      const [a, c, h] = await Promise.all([
        supabase.from("activities").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("activity_completions").select("*").order("completed_at", { ascending: false }).limit(100),
        supabase.from("activity_completions").select("*, activities(name, reset_type)").order("completed_at", { ascending: false }).limit(50),
      ]);
      return {
        activities: a.data ?? [] as Activity[],
        completions: c.data ?? [] as ActivityCompletion[],
        completionHistory: (h.data as ActivityCompletionWithActivity[]) ?? [],
      };
    },
    { activities: [] as Activity[], completions: [] as ActivityCompletion[], completionHistory: [] as ActivityCompletionWithActivity[] }
  );
  const { activities, completions, completionHistory } = data;
  const [dailyCountdown, setDailyCountdown] = useState("");
  const [weeklyCountdown, setWeeklyCountdown] = useState("");
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  useEffect(() => {
    function update() {
      const now = new Date();
      setDailyCountdown(formatTimeRemaining(getNextDailyReset(now), now));
      setWeeklyCountdown(formatTimeRemaining(getNextWeeklyReset(now), now));
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  function isCompleted(activity: Activity): boolean {
    const period = activity.reset_type === "daily"
      ? getCurrentDailyPeriod()
      : getCurrentWeeklyPeriod();
    return completions.some(
      (c) => c.activity_id === activity.id && c.reset_period === period
    );
  }

  function getCategoryStats(category: CategoryTab) {
    const items = activities.filter((a) => a.category === category);
    const completed = items.filter((a) => isCompleted(a)).length;
    return { total: items.length, completed };
  }

  async function toggleComplete(activity: Activity) {
    const supabase = createClient();
    const period = activity.reset_type === "daily"
      ? getCurrentDailyPeriod()
      : getCurrentWeeklyPeriod();

    const existing = completions.find(
      (c) => c.activity_id === activity.id && c.reset_period === period
    );

    if (existing) {
      const { error } = await supabase.from("activity_completions").delete().eq("id", existing.id);
      if (error) {
        toast.error("Failed to update activity");
        return;
      }
      toast.success(`"${activity.name}" marked incomplete`);
    } else {
      const { error } = await supabase.from("activity_completions").insert({
        activity_id: activity.id,
        reset_period: period,
      });
      if (error) {
        toast.error("Failed to complete activity");
        return;
      }
      toast.success(`"${activity.name}" completed`);
    }
    refetch();
  }

  async function handleAdd(formData: FormData) {
    const name = formData.get("name") as string;
    const supabase = createClient();
    const { error } = await supabase.from("activities").insert({
      name,
      category: formData.get("category") as string,
      reset_type: formData.get("reset_type") as string,
      description: (formData.get("description") as string) || null,
    });
    if (error) {
      toast.error("Failed to add activity");
      return;
    }
    toast.success(`"${name}" added`);
    setOpen(false);
    refetch();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("activities")
      .update({ is_active: false })
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete activity");
      return;
    }
    toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
    refetch();
  }

  const categorized = Object.fromEntries(
    TAB_CONFIG.map((tab) => [
      tab.value,
      activities.filter((a) => a.category === tab.value),
    ])
  ) as Record<CategoryTab, Activity[]>;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground">Track time-gated dailies and weeklies</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />Add Activity
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category" defaultValue="daily">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reset Type</Label>
                  <Select name="reset_type" defaultValue="daily">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Daily Reset</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyCountdown}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Reset</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyCountdown}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          {TAB_CONFIG.map((tab) => {
            const stats = getCategoryStats(tab.value);
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label} ({stats.completed}/{stats.total})
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="history">
            History
          </TabsTrigger>
        </TabsList>

        {TAB_CONFIG.map((tab) => {
          const items = categorized[tab.value];
          const stats = getCategoryStats(tab.value);
          const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              {stats.total > 0 && (
                <Progress value={pct}>
                  <ProgressLabel>{tab.label}</ProgressLabel>
                  <ProgressValue>
                    {() => `${stats.completed}/${stats.total} complete`}
                  </ProgressValue>
                </Progress>
              )}

              <div className="space-y-2">
                {items.map((activity) => {
                  const completed = isCompleted(activity);
                  return (
                    <Card key={activity.id}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Checkbox
                          checked={completed}
                          onCheckedChange={() => toggleComplete(activity)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${completed ? "line-through text-muted-foreground" : ""}`}>
                            {activity.name}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">{tab.badgeLabel}</Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(activity)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {tab.value === "daily" && <CalendarCheck className="h-10 w-10 text-muted-foreground/50 mb-3" />}
                  {tab.value === "weekly" && <ListChecks className="h-10 w-10 text-muted-foreground/50 mb-3" />}
                  {tab.value === "event" && <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />}
                  {tab.value === "other" && <Plus className="h-10 w-10 text-muted-foreground/50 mb-3" />}
                  <p className="text-muted-foreground font-medium">
                    No {tab.label.toLowerCase()} yet
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Click &quot;Add Activity&quot; to create your first {tab.value} activity.
                  </p>
                </div>
              )}
            </TabsContent>
          );
        })}

        <TabsContent value="history" className="space-y-4">
          {completionHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">No completion history yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Complete activities to see your history here.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
              {Object.entries(
                completionHistory.reduce<Record<string, ActivityCompletionWithActivity[]>>(
                  (groups, completion) => {
                    const dateKey = new Date(completion.completed_at).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                    if (!groups[dateKey]) groups[dateKey] = [];
                    groups[dateKey].push(completion);
                    return groups;
                  },
                  {}
                )
              ).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{date}</h3>
                  <div className="space-y-2">
                    {items.map((completion) => (
                      <Card key={completion.id}>
                        <CardContent className="flex items-center gap-3 p-4">
                          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {completion.activities?.name ?? "Unknown Activity"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(completion.completed_at).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {completion.activities?.reset_type === "weekly" ? "Weekly" : "Daily"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This will remove it from your activity list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
