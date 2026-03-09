"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, ExternalLink, Search, Trash2, Pencil, BookmarkX, Library } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Resource } from "@/lib/types";

const RESOURCE_TYPES = ["guide", "tool", "video", "wiki", "discord", "other"] as const;

export function ResourcesContent({ resources }: { resources: Resource[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const router = useRouter();

  async function handleAdd(formData: FormData) {
    const supabase = createClient();
    const tagsRaw = formData.get("tags") as string;

    const { error } = await supabase.from("resources").insert({
      title: formData.get("title") as string,
      url: (formData.get("url") as string) || null,
      resource_type: (formData.get("type") as string) || null,
      author: (formData.get("author") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : [],
    });

    if (error) {
      toast.error("Failed to add resource");
      return;
    }

    toast.success("Resource added");
    setOpen(false);
    router.refresh();
  }

  async function handleEdit(formData: FormData) {
    if (!editTarget) return;

    const supabase = createClient();
    const tagsRaw = formData.get("tags") as string;

    const { error } = await supabase
      .from("resources")
      .update({
        title: formData.get("title") as string,
        url: (formData.get("url") as string) || null,
        resource_type: (formData.get("type") as string) || null,
        author: (formData.get("author") as string) || null,
        notes: (formData.get("notes") as string) || null,
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : [],
      })
      .eq("id", editTarget.id);

    if (error) {
      toast.error("Failed to update resource");
      return;
    }

    toast.success("Resource updated");
    setEditTarget(null);
    router.refresh();
  }

  async function handleDelete(resource: Resource) {
    const supabase = createClient();

    const { error } = await supabase.from("resources").delete().eq("id", resource.id);

    if (error) {
      toast.error("Failed to delete resource");
      return;
    }

    toast.success(`"${resource.title}" deleted`);
    setDeleteTarget(null);
    router.refresh();
  }

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Trusted guides and references
            {resources.length > 0 && (
              <span className="ml-1">
                &middot; {resources.length} {resources.length === 1 ? "resource" : "resources"}
              </span>
            )}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />Add Resource
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" type="url" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="type">
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" name="author" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="gear, guide, beginner" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
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

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Resource</DialogTitle></DialogHeader>
          {editTarget && (
            <form action={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" name="title" required defaultValue={editTarget.title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input id="edit-url" name="url" type="url" defaultValue={editTarget.url ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select name="type" defaultValue={editTarget.resource_type ?? undefined}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-author">Author</Label>
                  <Input id="edit-author" name="author" defaultValue={editTarget.author ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input id="edit-tags" name="tags" defaultValue={editTarget.tags.join(", ")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" name="notes" defaultValue={editTarget.notes ?? ""} />
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {search && filtered.length > 0 && filtered.length !== resources.length && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {resources.length} {resources.length === 1 ? "resource" : "resources"}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{resource.title}</p>
                  {resource.resource_type && (
                    <Badge variant="outline">{resource.resource_type}</Badge>
                  )}
                </div>
                {resource.author && (
                  <p className="text-sm text-muted-foreground">by {resource.author}</p>
                )}
                {resource.notes && (
                  <p className="text-sm text-muted-foreground">{resource.notes}</p>
                )}
                {resource.tags.length > 0 && (
                  <div className="flex gap-1">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditTarget(resource)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(resource)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon-sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && resources.length > 0 && search && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <BookmarkX className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No matches found</p>
                <p className="text-sm text-muted-foreground">
                  No resources match &quot;{search}&quot;. Try a different search term.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </CardContent>
          </Card>
        )}
        {resources.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Library className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No resources yet</p>
                <p className="text-sm text-muted-foreground">
                  Save your favorite BDO guides, tools, videos, and references in one place.
                </p>
              </div>
              <Button variant="outline" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Add Resource
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
