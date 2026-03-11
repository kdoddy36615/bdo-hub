"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/* ---------- Types ---------- */

interface DailyTask {
  id: string;
  user_id: string;
  label: string;
  category: string;
  sort_order: number;
  created_at: string;
  isDefault?: boolean;
}

interface DailyCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

/* ---------- Constants ---------- */

const DEFAULT_TASKS: { label: string; category: string; sort_order: number }[] =
  [
    // Daily
    { label: "Imperial Cooking/Alchemy", category: "daily", sort_order: 0 },
    { label: "Boss Scroll", category: "daily", sort_order: 1 },
    { label: "Adventurer's Board", category: "daily", sort_order: 2 },
    { label: "Gift from Valks", category: "daily", sort_order: 3 },
    { label: "Check Events", category: "daily", sort_order: 4 },
    // Weekly
    { label: "Atoraxxion", category: "weekly", sort_order: 10 },
    { label: "Weekly Boss Scroll", category: "weekly", sort_order: 11 },
    { label: "Family Quest", category: "weekly", sort_order: 12 },
    // Optional
    { label: "Node War Prep", category: "optional", sort_order: 20 },
    { label: "World Boss", category: "optional", sort_order: 21 },
    { label: "Pit of Undying", category: "optional", sort_order: 22 },
  ];

const CATEGORY_COLORS: Record<string, string> = {
  daily: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  weekly: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  optional: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  custom: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const CATEGORY_ORDER = ["daily", "weekly", "optional", "custom"];

/** Get today's date in UTC as YYYY-MM-DD */
function getUtcDateStr(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/** Get the next midnight UTC as a Date */
function getNextResetTime(): Date {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow;
}

/** Format a duration in ms as HH:MM:SS */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ---------- Main Component ---------- */

export function ChecklistContent() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completions, setCompletions] = useState<DailyCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState("");
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("custom");
  const [addingTask, setAddingTask] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayUtc = getUtcDateStr();

  // Countdown timer
  useEffect(() => {
    function updateCountdown() {
      const ms = getNextResetTime().getTime() - Date.now();
      setCountdown(formatCountdown(ms));
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load tasks and completions
  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [tasksRes, completionsRes] = await Promise.all([
      supabase
        .from("daily_tasks")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("daily_completions")
        .select("*")
        .eq("completed_date", todayUtc),
    ]);

    if (tasksRes.error) {
      toast.error("Failed to load tasks");
      setLoading(false);
      return;
    }

    let userTasks = tasksRes.data as DailyTask[];

    // Seed default tasks if user has none
    if (userTasks.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from("daily_tasks")
        .insert(DEFAULT_TASKS.map((t) => ({ ...t, user_id: user.id })))
        .select();

      if (seedError) {
        toast.error("Failed to create default tasks");
        setLoading(false);
        return;
      }
      userTasks = seeded as DailyTask[];
    }

    setTasks(userTasks);
    setCompletions((completionsRes.data as DailyCompletion[]) ?? []);
    setLoading(false);
  }, [todayUtc]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    const groups: Record<string, DailyTask[]> = {};
    for (const task of tasks) {
      const cat = task.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    }
    // Sort categories by predefined order
    const sorted: [string, DailyTask[]][] = [];
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) sorted.push([cat, groups[cat]]);
    }
    // Any remaining categories not in the predefined list
    for (const cat of Object.keys(groups)) {
      if (!CATEGORY_ORDER.includes(cat)) sorted.push([cat, groups[cat]]);
    }
    return sorted;
  }, [tasks]);

  // Completion helpers
  const completedTaskIds = useMemo(
    () => new Set(completions.map((c) => c.task_id)),
    [completions]
  );

  const completedCount = completedTaskIds.size;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Toggle completion
  async function handleToggle(taskId: string) {
    setToggling((prev) => new Set(prev).add(taskId));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      return;
    }

    const isCompleted = completedTaskIds.has(taskId);

    if (isCompleted) {
      // Remove completion
      const completion = completions.find((c) => c.task_id === taskId);
      if (completion) {
        const { error } = await supabase
          .from("daily_completions")
          .delete()
          .eq("id", completion.id);
        if (error) {
          toast.error("Failed to update");
        } else {
          setCompletions((prev) => prev.filter((c) => c.id !== completion.id));
        }
      }
    } else {
      // Add completion
      const { data, error } = await supabase
        .from("daily_completions")
        .insert({
          task_id: taskId,
          user_id: user.id,
          completed_date: todayUtc,
        })
        .select()
        .single();
      if (error) {
        toast.error("Failed to update");
      } else {
        setCompletions((prev) => [...prev, data as DailyCompletion]);
      }
    }

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }

  // Add custom task
  async function handleAddTask() {
    if (!newTaskLabel.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setSaving(false);
      return;
    }

    const maxOrder = tasks.reduce(
      (max, t) => Math.max(max, t.sort_order),
      0
    );

    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user.id,
        label: newTaskLabel.trim(),
        category: newTaskCategory,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      toast.error("Failed to add task");
      return;
    }
    setTasks((prev) => [...prev, data as DailyTask]);
    setNewTaskLabel("");
    setAddingTask(false);
    toast.success("Task added!");
  }

  // Delete task
  async function handleDeleteTask(taskId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);
    if (error) {
      toast.error("Failed to delete task");
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletions((prev) => prev.filter((c) => c.task_id !== taskId));
    toast.success("Task deleted");
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Daily Checklist</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daily Checklist</h1>
          <p className="text-muted-foreground mt-1">
            {completedCount}/{totalCount} completed today
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Reset in</span>
            <span className="text-sm font-mono font-semibold tabular-nums">
              {countdown}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card className="border-border bg-card rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today&apos;s Progress</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} />
        </CardContent>
      </Card>

      {/* Task Groups */}
      {groupedTasks.map(([category, categoryTasks]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
            <Badge
              className={`text-[10px] px-1.5 py-0 h-5 border ${CATEGORY_COLORS[category] ?? CATEGORY_COLORS.custom}`}
            >
              {categoryTasks.filter((t) => completedTaskIds.has(t.id)).length}/
              {categoryTasks.length}
            </Badge>
          </div>

          <Card className="border-border bg-card rounded-xl">
            <CardContent className="p-0 divide-y divide-border">
              {categoryTasks.map((task) => {
                const isCompleted = completedTaskIds.has(task.id);
                const isToggling = toggling.has(task.id);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors group ${
                      isCompleted ? "opacity-60" : ""
                    }`}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggle(task.id)}
                      disabled={isToggling}
                      className="shrink-0"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        isCompleted
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.label}
                    </span>
                    {isToggling && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                    )}
                    <button
                      className="p-1.5 rounded-md text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      title="Delete task"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Add Task */}
      {addingTask ? (
        <Card className="border-primary/30 bg-primary/[0.02] rounded-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">New Task</span>
            </div>

            <Input
              placeholder="Task name..."
              value={newTaskLabel}
              onChange={(e) => setNewTaskLabel(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
              }}
            />

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Category:</span>
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewTaskCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                    newTaskCategory === cat
                      ? CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.custom
                      : "border-border/50 text-muted-foreground/50 hover:text-muted-foreground hover:border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddingTask(false);
                  setNewTaskLabel("");
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={saving || !newTaskLabel.trim()}
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                )}
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <button
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground/60 hover:border-primary/30 hover:text-muted-foreground transition-colors"
          onClick={() => setAddingTask(true)}
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare className="mb-3 h-10 w-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            No tasks yet. Add one to get started!
          </p>
        </div>
      )}
    </div>
  );
}
