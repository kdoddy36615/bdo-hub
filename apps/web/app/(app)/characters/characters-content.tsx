"use client";

import { useState } from "react";
import { useSupabaseFetch } from "@/lib/hooks/use-supabase-fetch";
import { PageSkeleton } from "@/components/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Users, Link2, Pencil, Trash2, Swords, Shield, X, ChevronDown, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BDO_CLASSES } from "@/lib/constants";
import { toast } from "sonner";
import type { Character } from "@/lib/types";

const GEAR_SLOTS = {
  weapons: [
    { key: "mainhand", label: "Mainhand", category: "ap" },
    { key: "offhand", label: "Offhand", category: "ap" },
    { key: "awakening", label: "Awakening", category: "aap" },
  ],
  armor: [
    { key: "helmet", label: "Helmet", category: "dp" },
    { key: "armor", label: "Armor", category: "dp" },
    { key: "gloves", label: "Gloves", category: "dp" },
    { key: "shoes", label: "Shoes", category: "dp" },
  ],
  accessories: [
    { key: "necklace", label: "Necklace", category: "mixed" },
    { key: "ring1", label: "Ring", category: "mixed" },
    { key: "ring2", label: "Ring", category: "mixed" },
    { key: "earring1", label: "Earring", category: "mixed" },
    { key: "earring2", label: "Earring", category: "mixed" },
    { key: "belt", label: "Belt", category: "mixed" },
  ],
} as const;

// --- Garmoth URL helpers ---
// We store a Garmoth build link inside the `notes` column using a
// `[garmoth:<url>]` prefix so it can be parsed back out for display.
const GARMOTH_PREFIX_RE = /^\[garmoth:(.*?)\]\n?/;

function parseGarmothUrl(notes: string | null): { garmothUrl: string | null; cleanNotes: string | null } {
  if (!notes) return { garmothUrl: null, cleanNotes: null };
  const match = notes.match(GARMOTH_PREFIX_RE);
  if (!match) return { garmothUrl: null, cleanNotes: notes };
  const garmothUrl = match[1] || null;
  const cleanNotes = notes.replace(GARMOTH_PREFIX_RE, "").trim() || null;
  return { garmothUrl, cleanNotes };
}

function encodeGarmothNotes(garmothUrl: string | null, notes: string | null): string | null {
  const trimmedUrl = garmothUrl?.trim() || null;
  const trimmedNotes = notes?.trim() || null;
  if (!trimmedUrl && !trimmedNotes) return null;
  if (!trimmedUrl) return trimmedNotes;
  const prefix = `[garmoth:${trimmedUrl}]`;
  return trimmedNotes ? `${prefix}\n${trimmedNotes}` : prefix;
}

function getGearScoreColor(gs: number): string {
  if (gs >= 700) return "text-purple-400";
  if (gs >= 600) return "text-green-400";
  if (gs >= 300) return "text-yellow-400";
  return "text-red-400";
}

function getGearScoreBgColor(gs: number): string {
  if (gs >= 700) return "bg-purple-500/10 ring-purple-500/20";
  if (gs >= 600) return "bg-green-500/10 ring-green-500/20";
  if (gs >= 300) return "bg-yellow-500/10 ring-yellow-500/20";
  return "bg-red-500/10 ring-red-500/20";
}

function getGearScoreLabel(gs: number): string {
  if (gs >= 700) return "End-Game";
  if (gs >= 600) return "Late-Game";
  if (gs >= 300) return "Mid-Game";
  return "Early-Game";
}

interface CharacterTagWithNames {
  id: string;
  main_character_id: string;
  tagged_character_id: string;
  gear_copied: string | null;
  marni_fuel_used: number;
  notes: string | null;
  created_at: string;
  main: { name: string; class_name: string } | null;
  tagged: { name: string; class_name: string } | null;
}

export function CharactersContent() {
  const { data, loading, refetch } = useSupabaseFetch(
    async (supabase) => {
      const [c, t] = await Promise.all([
        supabase.from("characters").select("*").order("is_main", { ascending: false }).order("level", { ascending: false }),
        supabase.from("character_tags").select("*, main:characters!main_character_id(name, class_name), tagged:characters!tagged_character_id(name, class_name)"),
      ]);
      return {
        characters: c.data ?? [] as Character[],
        tags: (t.data as CharacterTagWithNames[]) ?? [],
      };
    },
    { characters: [] as Character[], tags: [] as CharacterTagWithNames[] }
  );
  const { characters, tags } = data;
  const [charOpen, setCharOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [deletingChar, setDeletingChar] = useState<Character | null>(null);
  const [deleteTagOpen, setDeleteTagOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState<CharacterTagWithNames | null>(null);

  async function handleAddChar(formData: FormData) {
    const supabase = createClient();
    const garmothUrl = (formData.get("garmoth_url") as string) || null;
    const rawNotes = (formData.get("notes") as string) || null;
    const { error } = await supabase.from("characters").insert({
      name: formData.get("name") as string,
      class_name: formData.get("class_name") as string,
      level: parseInt(formData.get("level") as string) || 1,
      ap: parseInt(formData.get("ap") as string) || 0,
      aap: parseInt(formData.get("aap") as string) || 0,
      dp: parseInt(formData.get("dp") as string) || 0,
      is_main: formData.get("is_main") === "on",
      notes: encodeGarmothNotes(garmothUrl, rawNotes),
    });
    if (error) {
      toast.error("Failed to add character");
      return;
    }
    toast.success("Character added");
    setCharOpen(false);
    refetch();
  }

  async function handleEditChar(formData: FormData) {
    if (!editingChar) return;
    const supabase = createClient();
    const garmothUrl = (formData.get("garmoth_url") as string) || null;
    const rawNotes = (formData.get("notes") as string) || null;
    const { error } = await supabase
      .from("characters")
      .update({
        name: formData.get("name") as string,
        class_name: formData.get("class_name") as string,
        level: parseInt(formData.get("level") as string) || 1,
        ap: parseInt(formData.get("ap") as string) || 0,
        aap: parseInt(formData.get("aap") as string) || 0,
        dp: parseInt(formData.get("dp") as string) || 0,
        is_main: formData.get("is_main") === "on",
        notes: encodeGarmothNotes(garmothUrl, rawNotes),
      })
      .eq("id", editingChar.id);
    if (error) {
      toast.error("Failed to update character");
      return;
    }
    toast.success("Character updated");
    setEditOpen(false);
    setEditingChar(null);
    refetch();
  }

  async function handleAddTag(formData: FormData) {
    const supabase = createClient();
    const { error } = await supabase.from("character_tags").insert({
      main_character_id: formData.get("main_id") as string,
      tagged_character_id: formData.get("tagged_id") as string,
      gear_copied: (formData.get("gear_copied") as string) || null,
      marni_fuel_used: parseInt(formData.get("marni_fuel") as string) || 0,
      notes: (formData.get("notes") as string) || null,
    });
    if (error) {
      toast.error("Failed to create tag");
      return;
    }
    toast.success("Tag created");
    setTagOpen(false);
    refetch();
  }

  async function deleteCharacter() {
    if (!deletingChar) return;
    const supabase = createClient();
    const { error } = await supabase.from("characters").delete().eq("id", deletingChar.id);
    if (error) {
      toast.error("Failed to delete character");
      return;
    }
    toast.success(`${deletingChar.name} deleted`);
    setDeleteOpen(false);
    setDeletingChar(null);
    refetch();
  }

  async function deleteTag() {
    if (!deletingTag) return;
    const supabase = createClient();
    const { error } = await supabase.from("character_tags").delete().eq("id", deletingTag.id);
    if (error) {
      toast.error("Failed to delete tag");
      return;
    }
    toast.success("Tag deleted");
    setDeleteTagOpen(false);
    setDeletingTag(null);
    refetch();
  }

  function openEditDialog(char: Character) {
    setEditingChar(char);
    setEditOpen(true);
  }

  function openDeleteDialog(char: Character) {
    setDeletingChar(char);
    setDeleteOpen(true);
  }

  function openDeleteTagDialog(tag: CharacterTagWithNames) {
    setDeletingTag(tag);
    setDeleteTagOpen(true);
  }

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  function toggleCardExpanded(charId: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(charId)) {
        next.delete(charId);
      } else {
        next.add(charId);
      }
      return next;
    });
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground">
            {characters.length} {characters.length === 1 ? "character" : "characters"}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={tagOpen} onOpenChange={setTagOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <Link2 className="mr-2 h-4 w-4" />Tag
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Tag</DialogTitle></DialogHeader>
              <form action={handleAddTag} className="space-y-4">
                <div className="space-y-2">
                  <Label>Main Character</Label>
                  <Select name="main_id">
                    <SelectTrigger><SelectValue placeholder="Select main" /></SelectTrigger>
                    <SelectContent>
                      {characters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.class_name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tagged Character</Label>
                  <Select name="tagged_id">
                    <SelectTrigger><SelectValue placeholder="Select tagged" /></SelectTrigger>
                    <SelectContent>
                      {characters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.class_name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gear_copied">Gear Copied</Label>
                  <Input id="gear_copied" name="gear_copied" placeholder="e.g., Full boss gear" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marni_fuel">Marni Fuel Used</Label>
                  <Input id="marni_fuel" name="marni_fuel" type="number" defaultValue="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag_notes">Notes</Label>
                  <Input id="tag_notes" name="notes" />
                </div>
                <Button type="submit" className="w-full">Create Tag</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={charOpen} onOpenChange={setCharOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />Add Character
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Character</DialogTitle></DialogHeader>
              <form action={handleAddChar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select name="class_name">
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {BDO_CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" name="level" type="number" defaultValue="1" />
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <Checkbox id="is_main" name="is_main" />
                    <Label htmlFor="is_main">Main character</Label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ap">AP</Label>
                    <Input id="ap" name="ap" type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aap">AAP</Label>
                    <Input id="aap" name="aap" type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dp">DP</Label>
                    <Input id="dp" name="dp" type="number" defaultValue="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="garmoth_url">Garmoth Build URL</Label>
                  <Input
                    id="garmoth_url"
                    name="garmoth_url"
                    type="url"
                    placeholder="https://garmoth.com/character/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste your Garmoth.com build link to quick-access it from the character card.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" />
                </div>
                <Button type="submit" className="w-full">Add Character</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Character Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) setEditingChar(null);
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Character</DialogTitle></DialogHeader>
          {editingChar && (
            <form action={handleEditChar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Name</Label>
                <Input id="edit_name" name="name" required defaultValue={editingChar.name} />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select name="class_name" defaultValue={editingChar.class_name}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {BDO_CLASSES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_level">Level</Label>
                  <Input id="edit_level" name="level" type="number" defaultValue={editingChar.level} />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Checkbox id="edit_is_main" name="is_main" defaultChecked={editingChar.is_main} />
                  <Label htmlFor="edit_is_main">Main character</Label>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_ap">AP</Label>
                  <Input id="edit_ap" name="ap" type="number" defaultValue={editingChar.ap} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_aap">AAP</Label>
                  <Input id="edit_aap" name="aap" type="number" defaultValue={editingChar.aap} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_dp">DP</Label>
                  <Input id="edit_dp" name="dp" type="number" defaultValue={editingChar.dp} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_garmoth_url">Garmoth Build URL</Label>
                <Input
                  id="edit_garmoth_url"
                  name="garmoth_url"
                  type="url"
                  placeholder="https://garmoth.com/character/..."
                  defaultValue={parseGarmothUrl(editingChar.notes).garmothUrl ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Paste your Garmoth.com build link to quick-access it from the character card.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Input id="edit_notes" name="notes" defaultValue={parseGarmothUrl(editingChar.notes).cleanNotes ?? ""} />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Character Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => {
        setDeleteOpen(open);
        if (!open) setDeletingChar(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingChar?.name}</span>?
              This action cannot be undone and will also remove any associated tags.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={deleteCharacter}>
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirmation Dialog */}
      <Dialog open={deleteTagOpen} onOpenChange={(open) => {
        setDeleteTagOpen(open);
        if (!open) setDeletingTag(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the tag between{" "}
              <span className="font-semibold">{deletingTag?.main?.name ?? "?"}</span> and{" "}
              <span className="font-semibold">{deletingTag?.tagged?.name ?? "?"}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={deleteTag}>
              <Trash2 className="mr-2 h-4 w-4" />Delete Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Swords className="h-4 w-4 text-muted-foreground" />
            Class Meta
          </CardTitle>
          <CardDescription className="text-xs">
            Compare class performance on Garmoth&apos;s global grind rankings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <a
            href="https://garmoth.com/grind-tracker/class-ranking"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View Class Rankings
            </Button>
          </a>
        </CardContent>
      </Card>

      <Tabs defaultValue="characters">
        <TabsList>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="tags">Tags ({tags.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-3">
          <TooltipProvider>
          {characters.map((char) => {
            const isExpanded = expandedCards.has(char.id);
            const gs = char.gear_score;
            const { garmothUrl, cleanNotes } = parseGarmothUrl(char.notes);
            return (
            <Card key={char.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{char.name}</p>
                        {char.is_main && <Badge>Main</Badge>}
                        {garmothUrl && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <a
                                  href={garmothUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[11px] font-medium text-orange-400 ring-1 ring-orange-500/20 hover:bg-orange-500/20 transition-colors"
                                />
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                              Garmoth
                            </TooltipTrigger>
                            <TooltipContent>View build on Garmoth.com</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {char.class_name} - Lv. {char.level}
                      </p>
                      {cleanNotes && (
                        <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{cleanNotes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Gear Score Prominent Display */}
                    <Tooltip>
                      <TooltipTrigger
                        className={`flex flex-col items-center rounded-lg px-3 py-1.5 ring-1 ${getGearScoreBgColor(gs)} cursor-default`}
                      >
                        <span className={`text-lg font-bold tabular-nums ${getGearScoreColor(gs)}`}>
                          {gs}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Gear Score
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{getGearScoreLabel(gs)} Tier</p>
                          <p>AP {char.ap} + AAP {char.aap} + DP {char.dp} = GS {gs}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{char.ap}/{char.aap}</span>
                        <Shield className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{char.dp}</span>
                      </div>
                      <button
                        onClick={() => toggleCardExpanded(char.id)}
                        className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Gear Details
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(char)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {char.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteDialog(char)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete {char.name}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Gear Breakdown */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <Separator className="mb-4" />
                    {/* Stat Bars */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Swords className="h-3 w-3" /> AP
                          </span>
                          <span className="font-medium">{char.ap}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500 transition-all"
                            style={{ width: `${Math.min((char.ap / 350) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Swords className="h-3 w-3" /> AAP
                          </span>
                          <span className="font-medium">{char.aap}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
                            style={{ width: `${Math.min((char.aap / 350) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Shield className="h-3 w-3" /> DP
                          </span>
                          <span className="font-medium">{char.dp}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.min((char.dp / 450) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gear Slots Reference */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Weapons</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GEAR_SLOTS.weapons.map((slot) => (
                            <Badge
                              key={slot.key}
                              variant="outline"
                              className="text-xs font-normal gap-1"
                            >
                              <Swords className="h-2.5 w-2.5 text-red-400" />
                              {slot.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Armor</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GEAR_SLOTS.armor.map((slot) => (
                            <Badge
                              key={slot.key}
                              variant="outline"
                              className="text-xs font-normal gap-1"
                            >
                              <Shield className="h-2.5 w-2.5 text-blue-400" />
                              {slot.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Accessories</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GEAR_SLOTS.accessories.map((slot) => (
                            <Badge
                              key={slot.key}
                              variant="outline"
                              className="text-xs font-normal gap-1"
                            >
                              <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
                              {slot.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium">GS Formula:</span>{" "}
                      AP ({char.ap}) + AAP ({char.aap}) + DP ({char.dp}) ={" "}
                      <span className={`font-bold ${getGearScoreColor(gs)}`}>{gs}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
          </TooltipProvider>
          {characters.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No characters yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add your first character to start tracking your gear, levels, and class information across your account.
                </p>
                <Button className="mt-4" onClick={() => setCharOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add Your First Character
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tags" className="space-y-3">
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {tag.main?.name ?? "?"}{" "}
                    <span className="text-muted-foreground mx-1">&rarr;</span>{" "}
                    {tag.tagged?.name ?? "?"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tag.main?.class_name && (
                      <span className="text-xs text-muted-foreground">{tag.main.class_name}</span>
                    )}
                    {tag.main?.class_name && tag.tagged?.class_name && (
                      <span className="text-xs text-muted-foreground">&rarr;</span>
                    )}
                    {tag.tagged?.class_name && (
                      <span className="text-xs text-muted-foreground">{tag.tagged.class_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tag.gear_copied && `Gear: ${tag.gear_copied}`}
                    {tag.gear_copied && tag.marni_fuel_used > 0 && " | "}
                    {tag.marni_fuel_used > 0 && `Fuel: ${tag.marni_fuel_used}`}
                  </p>
                  {tag.notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{tag.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {new Date(tag.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openDeleteTagDialog(tag)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete tag</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tags.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <Link2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tags created yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Tags let you track gear-copied relationships between characters, including Marni fuel usage and shared equipment.
                </p>
                {characters.length >= 2 ? (
                  <Button variant="outline" className="mt-4" onClick={() => setTagOpen(true)}>
                    <Link2 className="mr-2 h-4 w-4" />Create Your First Tag
                  </Button>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Add at least two characters to create a tag.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
