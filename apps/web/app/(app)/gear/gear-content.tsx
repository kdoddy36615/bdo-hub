"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Swords,
  Shirt,
  Gem,
  Sparkles,
  Pencil,
  X,
  Save,
  Loader2,
  ArrowUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { PageSkeleton } from "@/components/page-skeleton";

interface GearSlot {
  id: string;
  slot_key: string;
  item_name: string;
  enhancement: string;
  ap: number;
  aap: number;
  dp: number;
  accuracy: number;
  evasion: number;
  dr: number;
  item_grade: number;
  notes: string;
  updated_at: string;
}

const SLOT_LABELS: Record<string, string> = {
  mainhand: "Mainhand",
  subweapon: "Sub-weapon",
  awakening: "Awakening",
  helmet: "Helmet",
  chest: "Chest",
  gloves: "Gloves",
  shoes: "Shoes",
  necklace: "Necklace",
  belt: "Belt",
  ring1: "Ring",
  ring2: "Ring",
  earring1: "Earring",
  earring2: "Earring",
  artifact: "Artifact",
};

const SLOT_GROUPS = [
  { label: "Weapons", icon: Swords, slots: ["mainhand", "subweapon", "awakening"] },
  { label: "Armor", icon: Shirt, slots: ["helmet", "chest", "gloves", "shoes"] },
  { label: "Accessories", icon: Gem, slots: ["necklace", "belt", "ring1", "ring2", "earring1", "earring2"] },
  { label: "Other", icon: Sparkles, slots: ["artifact"] },
];

const ENHANCEMENT_COLORS: Record<string, string> = {
  PEN: "text-orange-400",
  TET: "text-yellow-400",
  TRI: "text-blue-400",
  DUO: "text-green-400",
  PRI: "text-zinc-400",
  V: "text-orange-400",
  IV: "text-yellow-400",
  III: "text-blue-400",
  II: "text-green-400",
  I: "text-zinc-400",
};

const GRADE_BORDER: Record<number, string> = {
  0: "border-l-zinc-500",
  1: "border-l-green-500",
  2: "border-l-blue-500",
  3: "border-l-yellow-500",
  4: "border-l-orange-500",
};

const UPGRADE_SUGGESTIONS = [
  "Replace PEN Tuvala Rings with TET Kharazad Rings",
  "Replace PEN Tuvala Earring with TET Kharazad Earring",
  "Replace Capotia III Earring with TET Kharazad Earring",
  "Consider PEN Kharazad Necklace (from TET)",
  "Consider PEN Kharazad Belt (from TET)",
];

export function GearContent() {
  const [slots, setSlots] = useState<GearSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("gear_slots")
      .select("*")
      .order("updated_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load gear data");
        }
        if (data) setSlots(data as GearSlot[]);
        setLoading(false);
      });
  }, []);

  const slotMap = useMemo(() => {
    const map: Record<string, GearSlot> = {};
    for (const s of slots) {
      map[s.slot_key] = s;
    }
    return map;
  }, [slots]);

  const totalStats = useMemo(() => {
    let ap = 0;
    let aap = 0;
    let dp = 0;
    for (const s of slots) {
      ap += s.ap;
      aap += s.aap;
      dp += s.dp;
    }
    return { ap, aap, dp };
  }, [slots]);

  async function handleSave(slotKey: string, updates: Partial<GearSlot>) {
    setSaving(true);
    const supabase = createClient();
    const existing = slotMap[slotKey];

    if (existing) {
      const { error } = await supabase
        .from("gear_slots")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("slot_key", slotKey);

      if (error) {
        toast.error("Failed to update gear slot");
        setSaving(false);
        return;
      }
      setSlots((prev) =>
        prev.map((s) =>
          s.slot_key === slotKey
            ? { ...s, ...updates, updated_at: new Date().toISOString() }
            : s
        )
      );
    } else {
      const { data, error } = await supabase
        .from("gear_slots")
        .insert({ slot_key: slotKey, item_name: "Empty", ...updates })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create gear slot");
        setSaving(false);
        return;
      }
      setSlots((prev) => [...prev, data as GearSlot]);
    }

    toast.success("Gear updated!");
    setSaving(false);
    setEditingSlot(null);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gear Profile</h1>
        <p className="text-muted-foreground">Maegu &mdash; Track and plan your gear progression</p>
      </div>

      {/* Total Stats Banner */}
      <Card className="bg-muted/30">
        <CardContent className="flex flex-wrap items-center justify-center gap-6 py-5">
          <StatBox label="AP" value={totalStats.ap} color="text-red-400" />
          <div className="text-muted-foreground/40 text-2xl font-light">/</div>
          <StatBox label="AAP" value={totalStats.aap} color="text-red-300" />
          <div className="text-muted-foreground/40 text-2xl font-light">/</div>
          <StatBox label="DP" value={totalStats.dp} color="text-blue-400" />
        </CardContent>
      </Card>

      {/* Gear Groups */}
      {SLOT_GROUPS.map((group) => (
        <div key={group.label} className="space-y-3">
          <div className="flex items-center gap-2">
            <group.icon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{group.label}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.slots.map((slotKey) => {
              const slot = slotMap[slotKey];
              if (editingSlot === slotKey) {
                return (
                  <GearEditCard
                    key={slotKey}
                    slotKey={slotKey}
                    slot={slot}
                    saving={saving}
                    onSave={handleSave}
                    onCancel={() => setEditingSlot(null)}
                  />
                );
              }
              return (
                <GearCard
                  key={slotKey}
                  slotKey={slotKey}
                  slot={slot}
                  onEdit={() => setEditingSlot(slotKey)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Upgrade Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUp className="h-5 w-5 text-green-400" />
            Upgrade Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {UPGRADE_SUGGESTIONS.map((suggestion, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm"
            >
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-yellow-400" />
              <span>{suggestion}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

function GearCard({
  slotKey,
  slot,
  onEdit,
}: {
  slotKey: string;
  slot?: GearSlot;
  onEdit: () => void;
}) {
  const label = SLOT_LABELS[slotKey] ?? slotKey;
  const grade = slot?.item_grade ?? 0;
  const borderColor = GRADE_BORDER[grade] ?? GRADE_BORDER[0];
  const enhColor = slot?.enhancement
    ? ENHANCEMENT_COLORS[slot.enhancement] ?? "text-zinc-400"
    : "";

  return (
    <Card
      className={`border-l-4 ${borderColor} cursor-pointer transition-colors hover:border-primary/30 hover:bg-muted/20`}
      onClick={onEdit}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">
              {label}
            </p>
            <div className="flex items-baseline gap-1.5">
              {slot?.enhancement && (
                <span className={`text-sm font-bold ${enhColor}`}>
                  {slot.enhancement}
                </span>
              )}
              <p className="text-sm font-medium truncate">
                {slot?.item_name ?? "Empty"}
              </p>
            </div>
          </div>
          <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 mt-1" />
        </div>

        {slot && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {slot.ap > 0 && (
              <span>
                AP <span className="text-red-400 font-medium">{slot.ap}</span>
              </span>
            )}
            {slot.aap > 0 && (
              <span>
                AAP <span className="text-red-300 font-medium">{slot.aap}</span>
              </span>
            )}
            {slot.dp > 0 && (
              <span>
                DP <span className="text-blue-400 font-medium">{slot.dp}</span>
              </span>
            )}
            {slot.accuracy > 0 && (
              <span>
                Acc <span className="text-emerald-400 font-medium">{slot.accuracy}</span>
              </span>
            )}
            {slot.evasion > 0 && (
              <span>
                Eva <span className="text-purple-400 font-medium">{slot.evasion}</span>
              </span>
            )}
            {slot.dr > 0 && (
              <span>
                DR <span className="text-cyan-400 font-medium">{slot.dr}</span>
              </span>
            )}
          </div>
        )}

        {slot?.notes && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/70 truncate">
            {slot.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GearEditCard({
  slotKey,
  slot,
  saving,
  onSave,
  onCancel,
}: {
  slotKey: string;
  slot?: GearSlot;
  saving: boolean;
  onSave: (slotKey: string, updates: Partial<GearSlot>) => void;
  onCancel: () => void;
}) {
  const label = SLOT_LABELS[slotKey] ?? slotKey;
  const [itemName, setItemName] = useState(slot?.item_name ?? "");
  const [enhancement, setEnhancement] = useState(slot?.enhancement ?? "");
  const [ap, setAp] = useState(String(slot?.ap ?? 0));
  const [aap, setAap] = useState(String(slot?.aap ?? 0));
  const [dp, setDp] = useState(String(slot?.dp ?? 0));
  const [accuracy, setAccuracy] = useState(String(slot?.accuracy ?? 0));
  const [evasion, setEvasion] = useState(String(slot?.evasion ?? 0));
  const [dr, setDr] = useState(String(slot?.dr ?? 0));
  const [itemGrade, setItemGrade] = useState(String(slot?.item_grade ?? 0));
  const [notes, setNotes] = useState(slot?.notes ?? "");

  const gradeLabels = ["White", "Green", "Blue", "Yellow", "Orange"];

  return (
    <Card className="border-l-4 border-l-primary col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            Edit {label}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="h-8"
              placeholder="Item name"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Enhancement</label>
            <Input
              value={enhancement}
              onChange={(e) => setEnhancement(e.target.value)}
              className="h-8"
              placeholder="PEN, TET, etc."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Grade</label>
            <div className="flex gap-1">
              {gradeLabels.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setItemGrade(String(i))}
                  className={`flex-1 px-1 py-1 rounded text-[10px] font-medium transition-colors ${
                    String(i) === itemGrade
                      ? `text-white ${
                          i === 0
                            ? "bg-zinc-500"
                            : i === 1
                            ? "bg-green-600"
                            : i === 2
                            ? "bg-blue-600"
                            : i === 3
                            ? "bg-yellow-600"
                            : "bg-orange-600"
                        }`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">AP</label>
            <Input
              type="number"
              value={ap}
              onChange={(e) => setAp(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">AAP</label>
            <Input
              type="number"
              value={aap}
              onChange={(e) => setAap(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">DP</label>
            <Input
              type="number"
              value={dp}
              onChange={(e) => setDp(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Accuracy</label>
            <Input
              type="number"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Evasion</label>
            <Input
              type="number"
              value={evasion}
              onChange={(e) => setEvasion(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">DR</label>
            <Input
              type="number"
              value={dr}
              onChange={(e) => setDr(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !itemName.trim()}
            onClick={() =>
              onSave(slotKey, {
                item_name: itemName.trim(),
                enhancement: enhancement.trim(),
                ap: parseInt(ap) || 0,
                aap: parseInt(aap) || 0,
                dp: parseInt(dp) || 0,
                accuracy: parseInt(accuracy) || 0,
                evasion: parseInt(evasion) || 0,
                dr: parseInt(dr) || 0,
                item_grade: parseInt(itemGrade) || 0,
                notes: notes.trim(),
              })
            }
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
