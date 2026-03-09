"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Circle, ClipboardList, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import type { ProgressionItem } from "@/lib/types";

type SortOption = "priority" | "difficulty" | "status" | "name";
type FilterStatus = "all" | ProgressionItem["status"];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const DIFFICULTY_ORDER: Record<string, number> = {
  extreme: 0,
  hard: 1,
  medium: 2,
  easy: 3,
};

const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  not_started: 1,
  completed: 2,
  skipped: 3,
};

function applySortAndFilter(
  items: ProgressionItem[],
  sortBy: SortOption,
  filterStatus: FilterStatus,
): ProgressionItem[] {
  let result = items;

  if (filterStatus !== "all") {
    result = result.filter((item) => item.status === filterStatus);
  }

  result = [...result].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
      case "difficulty": {
        const aDiff = a.difficulty_est ? (DIFFICULTY_ORDER[a.difficulty_est] ?? 99) : 100;
        const bDiff = b.difficulty_est ? (DIFFICULTY_ORDER[b.difficulty_est] ?? 99) : 100;
        return aDiff - bDiff;
      }
      case "status":
        return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      case "name":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  return result;
}

const CATEGORIES = ["combat", "journal", "gear", "lifeskill", "quest", "other"] as const;

const STATUS_CYCLE: Record<string, ProgressionItem["status"]> = {
  not_started: "in_progress",
  in_progress: "completed",
  completed: "not_started",
  skipped: "not_started",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
};

function ItemForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<ProgressionItem>;
  onSubmit: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select name="category" defaultValue={defaultValues?.category ?? "combat"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select name="priority" defaultValue={defaultValues?.priority ?? "medium"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Difficulty</Label>
        <Select name="difficulty" defaultValue={defaultValues?.difficulty_est ?? undefined}>
          <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="extreme">Extreme</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
      </div>
      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
}

export function ProgressionContent({ items }: { items: ProgressionItem[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgressionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ProgressionItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const router = useRouter();

  async function handleAdd(formData: FormData) {
    const supabase = createClient();
    const { error } = await supabase.from("progression_items").insert({
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      priority: formData.get("priority") as string,
      difficulty_est: (formData.get("difficulty") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    if (error) {
      toast.error("Failed to add item");
      return;
    }
    setAddOpen(false);
    toast.success("Item added");
    router.refresh();
  }

  async function handleEdit(formData: FormData) {
    if (!editingItem) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("progression_items")
      .update({
        title: formData.get("title") as string,
        category: formData.get("category") as string,
        priority: formData.get("priority") as string,
        difficulty_est: (formData.get("difficulty") as string) || null,
        notes: (formData.get("notes") as string) || null,
      })
      .eq("id", editingItem.id);
    if (error) {
      toast.error("Failed to update item");
      return;
    }
    setEditOpen(false);
    setEditingItem(null);
    toast.success("Item updated");
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingItem) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("progression_items")
      .delete()
      .eq("id", deletingItem.id);
    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    setDeleteOpen(false);
    setDeletingItem(null);
    toast.success("Item deleted");
    router.refresh();
  }

  async function toggleStatus(e: React.MouseEvent, item: ProgressionItem) {
    e.stopPropagation();
    const supabase = createClient();
    const next = STATUS_CYCLE[item.status] ?? "not_started";
    const { error } = await supabase
      .from("progression_items")
      .update({ status: next })
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`Status changed to ${STATUS_LABELS[next]}`);
    router.refresh();
  }

  function openEdit(item: ProgressionItem) {
    setEditingItem(item);
    setEditOpen(true);
  }

  function openDelete(e: React.MouseEvent, item: ProgressionItem) {
    e.stopPropagation();
    setDeletingItem(item);
    setDeleteOpen(true);
  }

  function getCount(tab: string) {
    if (tab === "all") return items.length;
    return items.filter((i) => i.category === tab).length;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progression</h1>
          <p className="text-muted-foreground">Track your combat and gear progression</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />Add Item
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Progression Item</DialogTitle>
            </DialogHeader>
            <ItemForm onSubmit={handleAdd} submitLabel="Add" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Progression Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              key={editingItem.id}
              defaultValues={editingItem}
              onSubmit={handleEdit}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeletingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingItem?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({getCount("all")})</TabsTrigger>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize">
              {c} ({getCount(c)})
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Sort & Filter Toolbar */}
        <div className="flex items-center gap-3 pt-3">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onValueChange={(v: string | null) => {
                if (v) setSortBy(v as SortOption);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority (High to Low)</SelectItem>
                <SelectItem value="difficulty">Difficulty (High to Low)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterStatus}
              onValueChange={(v: string | null) => {
                if (v) setFilterStatus(v as FilterStatus);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {["all", ...CATEGORIES].map((tab) => {
          const byCategory = items.filter((i) => tab === "all" || i.category === tab);
          const filtered = applySortAndFilter(byCategory, sortBy, filterStatus);
          return (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {filtered.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => openEdit(item)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0"
                        onClick={(e) => toggleStatus(e, item)}
                        title={`Status: ${STATUS_LABELS[item.status]} (click to cycle)`}
                      >
                        <Circle className={`h-3.5 w-3.5 ${STATUS_COLORS[item.status]} rounded-full`} />
                      </Button>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.difficulty_est && (
                        <Badge variant="outline">{item.difficulty_est}</Badge>
                      )}
                      <Badge className={PRIORITY_COLORS[item.priority]}>{item.priority}</Badge>
                      <Badge variant="secondary">{item.status.replace("_", " ")}</Badge>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                        title="Edit item"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => openDelete(e, item)}
                        title="Delete item"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-1">
                    {filterStatus !== "all"
                      ? `No ${filterStatus.replace("_", " ")} items${tab !== "all" ? ` in ${tab}` : ""}`
                      : tab === "all"
                        ? "No progression items yet"
                        : `No ${tab} items yet`}
                  </h3>
                  <p className="text-sm text-muted-foreground/60 mb-4">
                    {filterStatus !== "all"
                      ? "Try changing the status filter to see more items."
                      : tab === "all"
                        ? "Add your first item to start tracking your progression."
                        : `Add an item with the "${tab}" category to see it here.`}
                  </p>
                  {filterStatus !== "all" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      Clear Filter
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />Add Item
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
