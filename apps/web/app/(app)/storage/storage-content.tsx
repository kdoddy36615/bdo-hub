"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Archive, Plus, Edit2, Trash2, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_STORAGE_LAYOUT } from "@/lib/constants";
import { toast } from "sonner";
import type { StorageTab } from "@/lib/types";

export function StorageContent({ tabs }: { tabs: StorageTab[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTab, setEditTab] = useState<StorageTab | null>(null);
  const router = useRouter();

  async function seedDefaults() {
    const supabase = createClient();
    const { error } = await supabase.from("storage_tabs").insert(
      DEFAULT_STORAGE_LAYOUT.map((item) => ({
        tab_number: item.tab,
        label: item.label,
      }))
    );
    if (error) {
      toast.error("Failed to load defaults: " + error.message);
    } else {
      toast.success("Default storage layout loaded");
      router.refresh();
    }
  }

  async function handleAdd(formData: FormData) {
    const supabase = createClient();
    const tabNumber = parseInt(formData.get("tab_number") as string);
    const label = formData.get("label") as string;
    const description = (formData.get("description") as string) || null;

    const existing = tabs.find((t) => t.tab_number === tabNumber);
    if (existing) {
      const { error } = await supabase
        .from("storage_tabs")
        .update({ label, description })
        .eq("id", existing.id);
      if (error) {
        toast.error("Failed to update tab: " + error.message);
        return;
      }
      toast.success(`Tab ${tabNumber} updated`);
    } else {
      const { error } = await supabase
        .from("storage_tabs")
        .insert({ tab_number: tabNumber, label, description });
      if (error) {
        toast.error("Failed to add tab: " + error.message);
        return;
      }
      toast.success(`Tab ${tabNumber} added`);
    }
    setAddOpen(false);
    router.refresh();
  }

  async function handleEditSave(formData: FormData) {
    if (!editTab?.id) return;
    const supabase = createClient();
    const label = formData.get("label") as string;
    const description = (formData.get("description") as string) || null;

    const { error } = await supabase
      .from("storage_tabs")
      .update({ label, description })
      .eq("id", editTab.id);

    if (error) {
      toast.error("Failed to update tab: " + error.message);
      return;
    }
    toast.success(`Tab ${editTab.tab_number} updated`);
    setEditTab(null);
    router.refresh();
  }

  async function handleDelete(tab: StorageTab) {
    if (!tab.id) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("storage_tabs")
      .delete()
      .eq("id", tab.id);

    if (error) {
      toast.error("Failed to delete tab: " + error.message);
      return;
    }
    toast.success(`Tab ${tab.tab_number} deleted`);
    router.refresh();
  }

  const allTabs = Array.from({ length: 10 }, (_, i) => {
    const num = i + 1;
    const existing = tabs.find((t) => t.tab_number === num);
    return existing || { tab_number: num, label: `Tab ${num}`, description: null, id: null as string | null, user_id: "", color: null };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storage</h1>
          <p className="text-muted-foreground">Warehouse tab organization</p>
        </div>
        <div className="flex gap-2">
          {tabs.length === 0 && (
            <Button variant="outline" onClick={seedDefaults}>
              <PackageOpen className="mr-2 h-4 w-4" />
              Load Defaults
            </Button>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />Add Tab
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Storage Tab</DialogTitle></DialogHeader>
              <form action={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tab_number">Tab Number</Label>
                  <Input id="tab_number" name="tab_number" type="number" min="1" max="20" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" name="label" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Archive className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">No storage tabs configured</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Click "Load Defaults" to get started with a recommended layout, or add tabs manually.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allTabs.map((tab) => {
            const isConfigured = !!tab.id;
            return (
              <Card
                key={tab.tab_number}
                className={`group relative transition-colors ${
                  isConfigured
                    ? "cursor-pointer hover:border-primary/50"
                    : "opacity-40"
                }`}
                onClick={() => {
                  if (isConfigured) setEditTab(tab as StorageTab);
                }}
              >
                {isConfigured && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tab as StorageTab);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
                      isConfigured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {tab.tab_number}
                    </div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {tab.label}
                    </CardTitle>
                    {isConfigured && (
                      <Edit2 className="ml-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tab.description ? (
                    <p className="text-sm text-muted-foreground">{tab.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                      {isConfigured ? "No description" : "Not configured"}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTab} onOpenChange={(o) => { if (!o) setEditTab(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tab {editTab?.tab_number}</DialogTitle></DialogHeader>
          {editTab && (
            <form action={handleEditSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_label">Label</Label>
                <Input
                  id="edit_label"
                  name="label"
                  defaultValue={editTab.label}
                  key={editTab.id}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  name="description"
                  defaultValue={editTab.description ?? ""}
                  key={`desc-${editTab.id}`}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    handleDelete(editTab);
                    setEditTab(null);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
