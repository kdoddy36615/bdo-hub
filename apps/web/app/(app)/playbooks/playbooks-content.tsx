"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, BookOpen, ChevronDown, ChevronUp, Trash2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Playbook, PlaybookStep } from "@/lib/types";

const CATEGORIES = ["grinding", "boss", "lifeskill", "enhancing", "fishing", "weekly", "other"] as const;

interface PlaybookWithSteps extends Playbook {
  playbook_steps: PlaybookStep[];
}

export function PlaybooksContent() {
  const [playbooks, setPlaybooks] = useState<PlaybookWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<PlaybookWithSteps | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.from("playbooks").select("*, playbook_steps(*)").order("created_at", { ascending: false }).then(({ data }) => {
      setPlaybooks((data as PlaybookWithSteps[]) ?? []);
      setLoading(false);
    });
  }, []);

  async function handleAdd(formData: FormData) {
    const supabase = createClient();
    const stepsRaw = formData.get("steps") as string;
    const steps = stepsRaw.split("\n").filter((s) => s.trim());

    const { data: playbook, error } = await supabase
      .from("playbooks")
      .insert({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        category: (formData.get("category") as string) || null,
      })
      .select()
      .single();

    if (error || !playbook) {
      toast.error("Failed to create playbook");
      return;
    }

    if (steps.length > 0) {
      const { error: stepsError } = await supabase.from("playbook_steps").insert(
        steps.map((title, i) => ({
          playbook_id: playbook.id,
          step_number: i + 1,
          title: title.trim(),
        }))
      );
      if (stepsError) {
        toast.error("Playbook created but failed to add steps");
        setOpen(false);
        router.refresh();
        return;
      }
    }

    toast.success("Playbook created");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(playbook: PlaybookWithSteps) {
    const supabase = createClient();

    // Delete steps first (foreign key), then the playbook
    if (playbook.playbook_steps.length > 0) {
      await supabase.from("playbook_steps").delete().eq("playbook_id", playbook.id);
    }

    const { error } = await supabase.from("playbooks").delete().eq("id", playbook.id);

    if (error) {
      toast.error("Failed to delete playbook");
      return;
    }

    toast.success(`"${playbook.title}" deleted`);
    setDeleteTarget(null);

    // Collapse if this was the expanded one
    if (expanded === playbook.id) {
      setExpanded(null);
    }

    router.refresh();
  }

  function resetSteps(playbook: PlaybookWithSteps) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      for (const step of playbook.playbook_steps) {
        next.delete(step.id);
      }
      return next;
    });
    toast.success("Steps reset");
  }

  function toggleStep(stepId: string) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playbooks</h1>
          <p className="text-muted-foreground">Step-by-step checklists for gameplay workflows</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />New Playbook
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Playbook</DialogTitle></DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category">
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">Steps (one per line)</Label>
                <textarea
                  id="steps"
                  name="steps"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder={"Repair gear\nClear inventory\nActivate pets\nApply food buff"}
                />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Playbook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This will also remove all its steps. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {playbooks.map((pb) => {
          const isExpanded = expanded === pb.id;
          const steps = (pb.playbook_steps || []).sort((a, b) => a.step_number - b.step_number);
          const completedCount = steps.filter((s) => checkedSteps.has(s.id)).length;
          const allDone = steps.length > 0 && completedCount === steps.length;

          return (
            <Card key={pb.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : pb.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <CardTitle className="text-base">{pb.title}</CardTitle>
                    {pb.category && <Badge variant="outline">{pb.category}</Badge>}
                    {allDone && <Badge variant="secondary">Complete</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completedCount}/{steps.length}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {pb.description && <CardDescription>{pb.description}</CardDescription>}
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-3">
                  {steps.length > 0 ? (
                    <>
                      {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <Checkbox
                            checked={checkedSteps.has(step.id)}
                            onCheckedChange={() => toggleStep(step.id)}
                          />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${checkedSteps.has(step.id) ? "line-through text-muted-foreground" : ""}`}>
                              {step.step_number}. {step.title}
                            </p>
                            {step.content && (
                              <p className="text-xs text-muted-foreground">{step.content}</p>
                            )}
                          </div>
                          {step.is_optional && <Badge variant="outline" className="text-xs">Optional</Badge>}
                        </div>
                      ))}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {completedCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetSteps(pb)}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset All
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(pb);
                          }}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        This playbook has no steps yet. Edit it to add some.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(pb);
                        }}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete Playbook
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
        {playbooks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No playbooks yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first playbook to build step-by-step checklists for grinding rotations, boss prep, and more.
                </p>
              </div>
              <Button variant="outline" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Create Playbook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
