"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pickaxe, ChevronDown, ChevronRight, Save, Trash2, Fish, Clock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { GatheringItem } from "@/lib/types";

const STORAGE_KEY = "bdo-hub:gathering-notes";

type NotesMap = Record<string, string>;

function loadNotes(): NotesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: NotesMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function GatheringRow({
  item,
  isExpanded,
  onToggle,
  savedNote,
  onSaveNote,
  onDeleteNote,
}: {
  item: GatheringItem;
  isExpanded: boolean;
  onToggle: () => void;
  savedNote: string;
  onSaveNote: (note: string) => void;
  onDeleteNote: () => void;
}) {
  const [draft, setDraft] = useState(savedNote);
  const hasUnsaved = draft !== savedNote;

  // Sync draft when savedNote changes (e.g. after delete)
  useEffect(() => {
    setDraft(savedNote);
  }, [savedNote]);

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={onToggle}
      >
        <TableCell className="w-6">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          {item.name}
          {item.is_gathering_exclusive && (
            <Badge variant="outline" className="ml-2 text-xs">
              Exclusive
            </Badge>
          )}
        </TableCell>
        <TableCell>{item.use_description}</TableCell>
        <TableCell className="text-muted-foreground">
          {item.why_it_matters}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {item.market_availability}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/30 p-4">
            <div className="space-y-4">
              {/* Reference details */}
              <div className="grid gap-3 sm:grid-cols-2">
                {item.use_description && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Use
                    </p>
                    <p className="text-sm">{item.use_description}</p>
                  </div>
                )}
                {item.why_it_matters && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Why It Matters
                    </p>
                    <p className="text-sm">{item.why_it_matters}</p>
                  </div>
                )}
              </div>

              {/* Personal notes */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Personal Notes
                </p>
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="Add your tips, best gathering spots, or notes..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveNote(draft);
                    }}
                    disabled={!hasUnsaved}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Save Note
                  </Button>
                  {savedNote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote();
                      }}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}
                  {hasUnsaved && (
                    <span className="text-xs text-muted-foreground">
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function GatheringContent() {
  const [items, setItems] = useState<GatheringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<NotesMap>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.from("gathering_items").select("*").order("category").order("name").then(({ data }) => {
      setItems(data ?? []);
      setLoading(false);
    });
  }, []);

  // Load notes from localStorage on mount
  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSaveNote = useCallback((itemId: string, note: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (note.trim()) {
        next[itemId] = note;
      } else {
        delete next[itemId];
      }
      saveNotes(next);
      return next;
    });
    toast.success("Note saved");
  }, []);

  const handleDeleteNote = useCallback((itemId: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      delete next[itemId];
      saveNotes(next);
      return next;
    });
    toast.success("Note cleared");
  }, []);

  const categories = [...new Set(items.map((i) => i.category))];

  const notesCount = Object.keys(notes).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gathering Exclusives</h1>
        <p className="text-muted-foreground">
          Items primarily obtained from gathering
          {notesCount > 0 && (
            <span className="ml-1">
              &middot; {notesCount} personal {notesCount === 1 ? "note" : "notes"}
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pickaxe className="h-5 w-5" />
            Should You Gather?
          </CardTitle>
          <CardDescription>
            Not required for combat progression. Most items can be purchased on
            the marketplace. Gathering becomes valuable mainly for
            lifeskill-focused players. Click any row to expand details and add
            personal notes.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            Imperial Fishing
          </CardTitle>
          <CardDescription>
            Imperial fishing delivery resets and tips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Reset Cycle: Every 3 hours</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Common Times (EST):</p>
            <div className="flex flex-wrap gap-1.5">
              {["2 AM", "5 AM", "8 AM", "11 AM", "2 PM", "5 PM", "8 PM", "11 PM"].map((time) => (
                <Badge key={time} variant="outline" className="text-xs">{time}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Tip:</span> If the NPC is sold out, try changing channels or visiting less populated, distant towns like Valencia City, Dreighan, or O&apos;draxxia.
            </p>
            <p>
              <span className="font-medium text-foreground">Note:</span> If you are logged in during a reset, you may need to swap characters or servers to see the new inventory.
            </p>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-6" />
                  <TableHead>Item</TableHead>
                  <TableHead>Use</TableHead>
                  <TableHead>Why It Matters</TableHead>
                  <TableHead>Market</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items
                  .filter((i) => i.category === category)
                  .map((item) => (
                    <GatheringRow
                      key={item.id}
                      item={item}
                      isExpanded={expandedIds.has(item.id)}
                      onToggle={() => toggleExpanded(item.id)}
                      savedNote={notes[item.id] ?? ""}
                      onSaveNote={(note) => handleSaveNote(item.id, note)}
                      onDeleteNote={() => handleDeleteNote(item.id)}
                    />
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No gathering items loaded. Run the seed migration to populate
          reference data.
        </p>
      )}
    </div>
  );
}
