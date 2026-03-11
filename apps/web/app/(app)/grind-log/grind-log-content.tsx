"use client";

import { useState } from "react";
import { useSupabaseFetch } from "@/lib/hooks/use-supabase-fetch";
import { PageSkeleton } from "@/components/page-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Timer,
  TrendingUp,
  Clock,
  MapPin,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface GrindSession {
  id: string;
  user_id: string;
  spot_name: string;
  duration_minutes: number;
  silver_earned: number;
  trash_loot: number;
  special_drops: string;
  notes: string;
  grind_date: string;
  created_at: string;
}

function formatSilver(silver: number): string {
  if (silver >= 1_000_000_000) {
    return `${(silver / 1_000_000_000).toFixed(2)}B`;
  }
  if (silver >= 1_000_000) {
    return `${(silver / 1_000_000).toFixed(1)}M`;
  }
  if (silver >= 1_000) {
    return `${(silver / 1_000).toFixed(0)}K`;
  }
  return silver.toLocaleString();
}

function calcSilverPerHour(silver: number, minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.round(silver / (minutes / 60));
}

export function GrindLogContent() {
  const { data: sessions, loading, refetch } = useSupabaseFetch(
    async (supabase) => {
      const { data } = await supabase
        .from("grind_sessions")
        .select("*")
        .order("grind_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as GrindSession[];
    },
    [] as GrindSession[]
  );

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GrindSession | null>(null);
  const [saving, setSaving] = useState(false);

  // Stats calculations
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalHours = totalMinutes / 60;
  const totalSilver = sessions.reduce((sum, s) => sum + Number(s.silver_earned), 0);
  const avgSilverPerHour =
    totalMinutes > 0 ? Math.round(totalSilver / (totalMinutes / 60)) : 0;

  const spotCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.spot_name] = (acc[s.spot_name] || 0) + 1;
    return acc;
  }, {});
  const mostGrindedSpot =
    Object.entries(spotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  async function handleAdd(formData: FormData) {
    const spot_name = (formData.get("spot_name") as string).trim();
    const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10);
    const silver_millions = parseFloat(formData.get("silver_millions") as string);
    const trash_loot = parseInt(formData.get("trash_loot") as string, 10) || 0;
    const special_drops = (formData.get("special_drops") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const grind_date = (formData.get("grind_date") as string) || new Date().toISOString().split("T")[0];

    if (!spot_name) {
      toast.error("Spot name is required");
      return;
    }
    if (!duration_minutes || duration_minutes <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    if (isNaN(silver_millions) || silver_millions < 0) {
      toast.error("Silver earned must be a valid number");
      return;
    }

    const silver_earned = Math.round(silver_millions * 1_000_000);

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("grind_sessions").insert({
      spot_name,
      duration_minutes,
      silver_earned,
      trash_loot,
      special_drops,
      notes,
      grind_date,
    });
    setSaving(false);

    if (error) {
      toast.error("Failed to log session");
      return;
    }

    toast.success(`Grind session at "${spot_name}" logged`);
    setOpen(false);
    refetch();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("grind_sessions")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast.error("Failed to delete session");
      return;
    }

    toast.success("Session deleted");
    setDeleteTarget(null);
    refetch();
  }

  if (loading) return <PageSkeleton />;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grind Log</h1>
          <p className="text-muted-foreground">
            {totalSessions} session{totalSessions !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Log Session
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Grind Session</DialogTitle>
            </DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spot_name">Spot Name</Label>
                <Input
                  id="spot_name"
                  name="spot_name"
                  placeholder="e.g. Gyfin Rhasia Upper"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="1"
                    placeholder="60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="silver_millions">Silver Earned (millions)</Label>
                  <Input
                    id="silver_millions"
                    name="silver_millions"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trash_loot">Trash Loot Count</Label>
                  <Input
                    id="trash_loot"
                    name="trash_loot"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grind_date">Date</Label>
                  <Input
                    id="grind_date"
                    name="grind_date"
                    type="date"
                    defaultValue={today}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special_drops">Special Drops (optional)</Label>
                <Input
                  id="special_drops"
                  name="special_drops"
                  placeholder="e.g. Deboreka Necklace, Embers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="e.g. Used Agris, Loot Scroll active"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Log Session"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Silver/hr</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSilver(avgSilverPerHour)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Grinded</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{mostGrindedSpot}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Coins className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No grind sessions yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Click &quot;Log Session&quot; to record your first grind.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const silverPerHour = calcSilverPerHour(
              Number(session.silver_earned),
              session.duration_minutes
            );
            return (
              <Card key={session.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{session.spot_name}</span>
                      <Badge variant="outline">
                        {new Date(session.grind_date + "T00:00:00").toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </Badge>
                      <Badge variant="secondary">
                        {session.duration_minutes}min
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" />
                        {formatSilver(Number(session.silver_earned))} earned
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {formatSilver(silverPerHour)}/hr
                      </span>
                      {session.trash_loot > 0 && (
                        <span>{session.trash_loot.toLocaleString()} trash</span>
                      )}
                    </div>
                    {session.special_drops && (
                      <p className="text-sm text-amber-500">
                        Drops: {session.special_drops}
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setDeleteTarget(session)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grind session at &quot;
              {deleteTarget?.spot_name}&quot;? This cannot be undone.
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
