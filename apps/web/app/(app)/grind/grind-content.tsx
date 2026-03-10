"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/page-skeleton";
import {
  Search,
  Crosshair,
  Shield,
  Swords,
  ChevronDown,
  ChevronUp,
  MapPin,
  Gem,
  Star,
  Filter,
  X,
} from "lucide-react";

interface GrindSpot {
  id: number;
  name: string;
  zone: string;
  ap: string;
  dp: string;
  players: string;
  mob_type: string;
  spot_type: number;
  specials: string[];
  items: { main_key: number; name: string; grade: number }[];
  nodes: { name: string }[];
  drops: { main_key: number }[];
}

const ZONE_COLORS: Record<string, string> = {
  balenos: "bg-green-500/15 text-green-400 border-green-500/30",
  serendia: "bg-lime-500/15 text-lime-400 border-lime-500/30",
  calpheon: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  mediah: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  valencia: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  kamasylvia: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  drieghan: "bg-red-500/15 text-red-400 border-red-500/30",
  odyllita: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  "mountain of eternal winter": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "land of the morning light": "bg-rose-500/15 text-rose-400 border-rose-500/30",
  ulukita: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const DEFAULT_ZONE_COLOR = "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

const SPECIAL_LABELS: Record<string, { label: string; color: string }> = {
  "marni-realm": { label: "Marni Realm", color: "bg-purple-600" },
  ring: { label: "Ring", color: "bg-amber-600" },
  exp: { label: "EXP", color: "bg-blue-600" },
  elvia: { label: "Elvia", color: "bg-red-600" },
  "hadum-elvia": { label: "Hadum", color: "bg-red-800" },
  seasonal: { label: "Seasonal", color: "bg-green-600" },
  "atoraxxion-solo": { label: "Atoraxxion Solo", color: "bg-cyan-600" },
  "atoraxxion-coop": { label: "Atoraxxion Co-op", color: "bg-cyan-700" },
};

const GRADE_COLORS = [
  "text-zinc-400", // 0 white
  "text-green-400", // 1 green
  "text-blue-400", // 2 blue
  "text-yellow-400", // 3 yellow
  "text-orange-400", // 4 orange
];

const AP_BRACKETS = [
  { label: "Any AP", min: 0, max: 999 },
  { label: "< 200 AP", min: 0, max: 199 },
  { label: "200-250 AP", min: 200, max: 250 },
  { label: "250-280 AP", min: 251, max: 280 },
  { label: "280-310 AP", min: 281, max: 310 },
  { label: "310+ AP", min: 311, max: 999 },
];

export function GrindContent() {
  const [spots, setSpots] = useState<GrindSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedBracket, setSelectedBracket] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/garmoth/grind-spots")
      .then((r) => r.json())
      .then((data) => {
        // API returns object keyed by ID
        const spotsArray: GrindSpot[] = Object.values(data);
        // Filter out old/invalid spots
        const valid = spotsArray.filter((s) => s.name && !s.name.startsWith("(OLD)"));
        valid.sort((a, b) => {
          const apA = parseInt(a.ap) || 0;
          const apB = parseInt(b.ap) || 0;
          return apA - apB;
        });
        setSpots(valid);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const zones = useMemo(() => {
    const zoneSet = new Set(spots.map((s) => s.zone).filter(Boolean));
    return Array.from(zoneSet).sort();
  }, [spots]);

  const filteredSpots = useMemo(() => {
    let result = spots;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.zone?.toLowerCase().includes(q) ||
          s.items?.some((i) => i.name?.toLowerCase().includes(q))
      );
    }

    if (selectedZone) {
      result = result.filter((s) => s.zone === selectedZone);
    }

    const bracket = AP_BRACKETS[selectedBracket];
    if (bracket && selectedBracket > 0) {
      result = result.filter((s) => {
        const ap = parseInt(s.ap) || 0;
        return ap >= bracket.min && ap <= bracket.max;
      });
    }

    return result;
  }, [spots, searchQuery, selectedZone, selectedBracket]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grind Spots</h1>
        <p className="text-muted-foreground">
          {spots.length} spots from Garmoth &mdash; filter by AP, zone, or search
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search spots, zones, or loot..."
            className="h-8 pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            {AP_BRACKETS.map((b, i) => (
              <button
                key={b.label}
                onClick={() => setSelectedBracket(i)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedBracket === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mt-1" />
          {selectedZone && (
            <button
              onClick={() => setSelectedZone(null)}
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear zone
            </button>
          )}
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-opacity ${
                ZONE_COLORS[zone] ?? DEFAULT_ZONE_COLOR
              } ${selectedZone && selectedZone !== zone ? "opacity-40" : ""}`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredSpots.length} of {spots.length} spots
      </p>

      {/* Spot Cards */}
      <div className="space-y-2">
        {filteredSpots.map((spot) => (
          <Card
            key={spot.id}
            className="transition-colors hover:border-primary/30"
          >
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => setExpanded(expanded === spot.id ? null : spot.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Crosshair className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm leading-snug">{spot.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${ZONE_COLORS[spot.zone] ?? DEFAULT_ZONE_COLOR}`}>
                        {spot.zone}
                      </span>
                      {spot.specials?.map((s) => {
                        const info = SPECIAL_LABELS[s];
                        return info ? (
                          <Badge key={s} className={`text-xs ${info.color}`}>
                            {info.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Swords className="h-3 w-3 text-red-400" />
                      <span className="font-medium">{spot.ap || "?"} AP</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mt-0.5">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className="font-medium">{spot.dp || "?"} DP</span>
                    </div>
                  </div>
                  {expanded === spot.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expanded === spot.id && (
              <CardContent className="pt-0 space-y-3">
                {spot.nodes && spot.nodes.length > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {spot.nodes.map((n, i) => (
                        <span key={i} className="text-xs text-muted-foreground">{n.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {spot.items && spot.items.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gem className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Notable Drops</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {spot.items.map((item) => (
                        <span
                          key={item.main_key}
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted/50 border border-border ${GRADE_COLORS[item.grade] ?? "text-zinc-400"}`}
                        >
                          {item.grade >= 3 && <Star className="h-3 w-3 mr-1" />}
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>Players: {spot.players || "?"}</span>
                  <span>Mob type: {spot.mob_type || "unknown"}</span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredSpots.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Crosshair className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No spots match your filters
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearchQuery("");
                setSelectedZone(null);
                setSelectedBracket(0);
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
