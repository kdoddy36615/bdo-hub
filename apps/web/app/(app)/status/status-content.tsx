"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Wrench,
  Sparkles,
  Code2,
  Archive,
  Ban,
} from "lucide-react";

type ItemStatus = "done" | "in-progress" | "planned" | "backlog" | "blocked";

interface RoadmapItem {
  title: string;
  description: string;
  status: ItemStatus;
}

interface RoadmapSection {
  title: string;
  icon: React.ElementType;
  color: string;
  items: RoadmapItem[];
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; icon: React.ElementType }> = {
  done: { label: "Done", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  planned: { label: "Planned", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Circle },
  backlog: { label: "Backlog", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: Archive },
  blocked: { label: "Blocked", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Ban },
};

const ROADMAP: RoadmapSection[] = [
  {
    title: "Bug Fixes & Stability",
    icon: AlertTriangle,
    color: "text-red-400",
    items: [
      {
        title: "Fix useSupabaseFetch error handling",
        description: "Add .catch(), error state, and surface failures to user instead of silently swallowing them.",
        status: "planned",
      },
      {
        title: "Check .error in Supabase fetchers",
        description: "Every query does data ?? [] without checking .error — silent failures on RLS violations or network errors.",
        status: "planned",
      },
      {
        title: "Fix weekly period calculation",
        description: "getCurrentWeeklyPeriod() uses non-ISO week numbering. Breaks near year boundaries.",
        status: "planned",
      },
      {
        title: "Filter dashboard completions query",
        description: "Unbounded activity_completions query fetches all rows. Add date/period filter.",
        status: "planned",
      },
      {
        title: "Remove dead code in timers.ts",
        description: "Unused stdOffset variable and fragile DST detection.",
        status: "planned",
      },
    ],
  },
  {
    title: "Recently Shipped",
    icon: Sparkles,
    color: "text-green-400",
    items: [
      {
        title: "Grind Spots Browser",
        description: "189 grind spots from Garmoth API with AP/DP filtering, zone search, drop lists, and special labels.",
        status: "done",
      },
      {
        title: "News & Events + Coupons",
        description: "Live events with countdown timers, news feed, and copy-to-clipboard coupon codes from Garmoth.",
        status: "done",
      },
      {
        title: "Gear Profile Page",
        description: "Full gear loadout for Maegu with stats banner, enhancement colors, grade borders, and upgrade suggestions.",
        status: "done",
      },
      {
        title: "Buffs & Guides Reference",
        description: "Comprehensive buff guide covering guild, church, food, elixirs, villa, and scrolls with recommended stacks.",
        status: "done",
      },
      {
        title: "Priorities & Activities Guide",
        description: "Activity breakdown with rewards, silver/hr, priority levels, time-gate indicators, and daily checklist.",
        status: "done",
      },
      {
        title: "Mobile Sidebar Fix",
        description: "Sidebar drawer now closes on navigation tap on mobile.",
        status: "done",
      },
      {
        title: "Mentor Q&A — Full CRUD + Styling",
        description: "Inline answer form, edit/delete, author names, colored tags by category, Supabase storage.",
        status: "done",
      },
      {
        title: "Dashboard Live Data",
        description: "Active events and coupons from Garmoth displayed on dashboard.",
        status: "done",
      },
      {
        title: "12-Theme System",
        description: "6 dark + 6 light themes with CSS variables, persisted to localStorage.",
        status: "done",
      },
      {
        title: "Boss Timer Hero",
        description: "Previous/Next/Followed-By spawn display with grouped countdowns at top of Boss Tracker.",
        status: "done",
      },
    ],
  },
  {
    title: "Upcoming Features",
    icon: Wrench,
    color: "text-blue-400",
    items: [
      {
        title: "BDO Alerts API Integration",
        description: "Boss timers, coupon codes, and market data from bdoalerts.net. Waiting on API key approval.",
        status: "in-progress",
      },
      {
        title: "Update Boss Schedule (Dec 2025 Patch)",
        description: "Add Bulgasal, Uturi, Sangoon, Golden Pig King. Update all spawn_schedule data.",
        status: "planned",
      },
      {
        title: "Arsha.io Market Price Integration",
        description: "Live Central Market prices for enhancement mats and boss gear. Free API, no auth.",
        status: "planned",
      },
      {
        title: "Gear Upgrade Advisor",
        description: "Based on current gear, recommend next upgrade targets with market prices and guides.",
        status: "planned",
      },
      {
        title: "Adventure Log / Family Buff Tracker",
        description: "Track permanent family-wide AP/DP from Bartali's Log, Deve's, and other adventure logs.",
        status: "planned",
      },
      {
        title: "Boss Alt Location Tracking",
        description: "Show which alt character is parked at each boss location. Editable from boss tracker page.",
        status: "planned",
      },
    ],
  },
  {
    title: "Code Quality & Tech Debt",
    icon: Code2,
    color: "text-purple-400",
    items: [
      {
        title: "Generate Supabase TypeScript types",
        description: "Replace manual type assertions with generated types for compile-time schema safety.",
        status: "planned",
      },
      {
        title: "Break up large components",
        description: "Split dashboard-content.tsx (500+ lines) and bosses-content.tsx (589 lines) into sub-components.",
        status: "planned",
      },
      {
        title: "Supabase client singleton",
        description: "Create browser client once per context instead of per event handler.",
        status: "planned",
      },
      {
        title: "Extract shared isCompleted() utility",
        description: "Identical function duplicated in dashboard and activities. Move to shared lib.",
        status: "planned",
      },
      {
        title: "Wire up timezone setting",
        description: "Settings page has timezone field but all timers hardcode America/New_York.",
        status: "backlog",
      },
      {
        title: "Remove next-themes dependency",
        description: "Dead dependency — custom theme-provider.tsx is used instead.",
        status: "planned",
      },
      {
        title: "Expand test coverage",
        description: "Add component rendering tests. Currently 5 test files for 70+ source files.",
        status: "in-progress",
      },
    ],
  },
  {
    title: "Backlog / Ideas",
    icon: Archive,
    color: "text-zinc-400",
    items: [
      {
        title: "Optimistic UI updates",
        description: "Instant feedback on mutations instead of full refetch.",
        status: "backlog",
      },
      {
        title: "System theme (OS preference)",
        description: "Auto-detect light/dark from prefers-color-scheme.",
        status: "backlog",
      },
      {
        title: "Per-section loading skeletons",
        description: "Show skeleton for individual cards instead of full page skeleton.",
        status: "backlog",
      },
      {
        title: "Theme sync to Supabase",
        description: "Persist theme choice to user_settings for cross-device sync.",
        status: "backlog",
      },
    ],
  },
  {
    title: "Not Feasible",
    icon: Ban,
    color: "text-zinc-500",
    items: [
      {
        title: "Scrape garmoth.com directly",
        description: "Behind Cloudflare WAF + TOS prohibits it.",
        status: "blocked",
      },
      {
        title: "Embed BDO Foundry map",
        description: "X-Frame-Options: SAMEORIGIN blocks iframes. Linking out instead.",
        status: "blocked",
      },
      {
        title: "Pearl Abyss official API",
        description: "Doesn't exist. No public game data API from PA.",
        status: "blocked",
      },
    ],
  },
];

export function StatusContent() {
  const counts = ROADMAP.flatMap((s) => s.items).reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<ItemStatus, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Status & Roadmap</h1>
        <p className="text-muted-foreground">
          What&apos;s been built, what&apos;s coming, and what&apos;s on the backburner
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(STATUS_CONFIG) as [ItemStatus, typeof STATUS_CONFIG[ItemStatus]][]).map(
          ([key, config]) => (
            <Badge key={key} className={`${config.color} text-xs`}>
              <config.icon className="mr-1 h-3 w-3" />
              {counts[key] || 0} {config.label}
            </Badge>
          ),
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {ROADMAP.map((section) => (
          <Card key={section.title}>
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <section.icon className={`h-5 w-5 ${section.color}`} />
                <CardTitle className="text-base">{section.title}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {section.items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {section.items.map((item) => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors"
                  >
                    <config.icon
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        item.status === "done"
                          ? "text-green-400"
                          : item.status === "in-progress"
                            ? "text-blue-400"
                            : item.status === "blocked"
                              ? "text-red-400"
                              : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Last updated: March 2026 &bull; 16 pages &bull; 70+ source files &bull; Monorepo (pnpm workspaces)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
