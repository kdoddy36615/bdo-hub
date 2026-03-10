"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair,
  Compass,
  ScrollText,
  Skull,
  CalendarCheck,
  Coins,
  TrendingUp,
  Shield,
  Swords,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Zap,
  Gem,
  Trophy,
  Target,
} from "lucide-react";

type Priority = "high" | "medium" | "low";

interface Activity {
  name: string;
  description: string;
  rewards: string[];
  silverPerHour?: string;
  time: string;
  priority: Priority;
  tips?: string;
  yourStatus?: string;
}

interface ActivityCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  activities: Activity[];
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: "grinding",
    title: "Grinding",
    icon: Crosshair,
    color: "text-red-400",
    description:
      "Main silver income. Pick spots based on your AP/DP bracket. Use all buffs for best returns.",
    activities: [
      {
        name: "Main Rotation Grinding",
        description:
          "Your bread and butter. Grind at spots matching your gear score for consistent silver.",
        rewards: ["Silver (trash loot)", "Rare drops (accessories, crystals)", "Combat EXP", "Skill EXP"],
        silverPerHour: "200M–600M+ depending on spot & gear",
        time: "1–3 hour sessions",
        priority: "high",
        tips: "Use Agris Fever at high-value spots. Stack all buffs (church, food, draught, villa). Check Garmoth for best spots at your AP.",
        yourStatus: "At 266 AP / 358 DP, you can do most Elvia spots and some high-end Valencia spots.",
      },
      {
        name: "Marni's Realm (Solo)",
        description:
          "Instanced version of grind spots. No PvP, guaranteed rotation, but slightly lower rates.",
        rewards: ["Silver", "Same drops as open world", "Peaceful grinding"],
        silverPerHour: "Slightly less than contested open world",
        time: "1 hour sessions (ticket-based)",
        priority: "medium",
        tips: "Great when you don't want to deal with PvP or crowded rotations. Use when main spots are contested.",
      },
      {
        name: "Atoraxxion Dungeons",
        description:
          "Group PvE dungeons with unique loot. Vahmalkea, Sycrakea, Yolunakea, Orzeca variants.",
        rewards: ["Embers (for Blackstar gear)", "Lightstone components", "Silver", "Fun group content"],
        silverPerHour: "Variable — more about specific drops",
        time: "30–60 min per run",
        priority: "low",
        tips: "Worth doing if you need Blackstar materials or Lightstones. Find a group on Discord.",
      },
    ],
  },
  {
    id: "adventure-log",
    title: "Adventure Guide / Logs",
    icon: Compass,
    color: "text-blue-400",
    description:
      "Permanent stat boosts through adventure logs. These are one-time completions that give permanent AP/DP/stats.",
    activities: [
      {
        name: "Bartali's Adventure Log",
        description:
          "Early game adventure log. Easy to complete, gives permanent family stats.",
        rewards: ["+AP", "+DP", "+Weight Limit", "+Inventory Slots", "+Energy", "+Contribution"],
        time: "A few hours total",
        priority: "high",
        tips: "If you haven't finished this, do it ASAP. Free permanent stats for your whole family.",
        yourStatus: "Check your adventure log (O key → Adventure) to see progress.",
      },
      {
        name: "Deve's Encyclopedia",
        description: "Mid-game adventure log with decent rewards.",
        rewards: ["+AP", "+DP", "+Accuracy", "+Weight", "+Inventory"],
        time: "Several hours",
        priority: "high",
        tips: "Some chapters require specific knowledge or items. Use a guide.",
      },
      {
        name: "Rulupee's Travel Log",
        description: "Exploration-based adventure log. Requires visiting many locations.",
        rewards: ["+Max Energy", "+Contribution Points", "+Inventory"],
        time: "Many hours (exploration heavy)",
        priority: "medium",
        tips: "Good to chip away at during downtime. Not urgent but the energy is nice.",
      },
      {
        name: "Cliff's Rare Fish Guide",
        description: "Fishing-based adventure log. Requires catching specific fish.",
        rewards: ["+Inventory Slots", "+Weight Limit"],
        time: "RNG-dependent (can take a while)",
        priority: "low",
        tips: "Only if you like fishing or really want the inventory slots.",
      },
      {
        name: "Other Adventure Logs (Ellie, Crio, etc.)",
        description: "Various other logs added over time with different requirements.",
        rewards: ["+Stats", "+Inventory", "+Weight", "+Unique titles"],
        time: "Varies",
        priority: "medium",
        tips: "Check the Adventure tab regularly. New logs get added with patches.",
      },
    ],
  },
  {
    id: "quests",
    title: "Quests & Story",
    icon: ScrollText,
    color: "text-green-400",
    description:
      "Main story quests and side quests. Story gives Contribution EXP and unlocks regions. Some quest lines give AP/DP directly.",
    activities: [
      {
        name: "Main Story Quest (MSQ)",
        description:
          "The main questline through each region. Gives Tuvala/boss gear, CP, and unlocks content.",
        rewards: ["Contribution Points", "Inventory Slots", "Gear handouts", "Region unlocks"],
        time: "20–40 hours for full story",
        priority: "high",
        tips: "Complete at least through Valencia for the free gear and CP. Simplified questline available.",
        yourStatus: "If you have PEN Tuvala you've likely done the seasonal questline.",
      },
      {
        name: "Chenga Tome Questing (Combat EXP)",
        description:
          "Equip Chenga Tome of Wisdom, do specific side quests for massive combat EXP.",
        rewards: ["Huge Combat EXP per quest", "Fast leveling 58–61+"],
        time: "A few hours to 61",
        priority: "medium",
        tips: "Best way to level from 58 to 61. Much faster than grinding for those levels. Look up a Chenga guide.",
      },
      {
        name: "AP/DP Quest Accessories",
        description:
          "Specific questlines that reward Capotia-level accessories or stat boosts.",
        rewards: ["+AP or +DP accessories", "+Permanent stat boosts"],
        time: "Varies by quest",
        priority: "high",
        tips: "Valencia questline gives Capotia earring/ring at certain points. Check what's available at your level.",
      },
    ],
  },
  {
    id: "bosses",
    title: "World & Black Shrine Bosses",
    icon: Skull,
    color: "text-purple-400",
    description:
      "World bosses spawn on schedule. Black Shrine bosses are instanced. Both drop high-value items.",
    activities: [
      {
        name: "World Bosses (Scheduled)",
        description:
          "Karanda, Kzarka, Kutum, Nouver, Garmoth, Quint, Muraka, Vell, Offin. Spawn on a set schedule.",
        rewards: ["Boss gear boxes (Dandelion, Kzarka, Kutum, etc.)", "Concentrated Stones", "Hunter Seals", "Silver"],
        time: "5–15 min per boss",
        priority: "medium",
        tips: "Park alts at boss locations. Check your Boss Tracker page for schedule. Vell is weekly (Sunday) — make sure to do this one.",
        yourStatus: "You have boss alts — make sure they're parked at the right locations.",
      },
      {
        name: "Black Shrine Bosses",
        description:
          "Solo/group instanced boss fights. Use Black Shrine tokens to enter.",
        rewards: ["Caphras Stones", "Memory Fragments", "Boss aura", "High silver value"],
        time: "10–20 min per fight",
        priority: "high",
        tips: "Great silver per time invested. Do these whenever you have tokens. The difficulty scales — start with what you can handle.",
      },
      {
        name: "Rift Bosses (Scrolls)",
        description:
          "Weekly boss scrolls from Black Spirit. Solo or 5-person party for 5x loot.",
        rewards: ["Memory Fragments", "Concentrated Stones", "Hunter Seals"],
        time: "30–60 min for a full scroll group",
        priority: "medium",
        tips: "Always do in a 5-person party — you get loot from everyone's scrolls. Find groups in server chat or Discord.",
      },
    ],
  },
  {
    id: "dailies",
    title: "Dailies & Weeklies",
    icon: CalendarCheck,
    color: "text-amber-400",
    description:
      "Repeatable tasks that give consistent rewards. Don't skip these — they add up.",
    activities: [
      {
        name: "Rift Boss Scrolls (Weekly)",
        description: "Black Spirit gives weekly boss scroll quests. Share in a 5-man party.",
        rewards: ["Memory Fragments", "Concentrated Stones", "Hunter Seals"],
        time: "~1 hour with party",
        priority: "high",
        tips: "NEVER skip weekly scrolls. The Memory Fragments alone are worth it.",
      },
      {
        name: "Vell (Weekly Sunday Boss)",
        description: "Sea boss Vell spawns every Sunday. Park a character with a boat.",
        rewards: ["Vell's Heart (BIS crystal, ~4B)", "Vell's Concentrated Magic (guaranteed)"],
        time: "15–30 min",
        priority: "high",
        tips: "Even if you don't get the Heart drop, Vell's Concentrated Magic sells for good silver. Don't miss this.",
      },
      {
        name: "Imperial Cooking/Alchemy (Daily)",
        description: "Turn in crafted food/elixirs to Imperial NPCs for guaranteed silver.",
        rewards: ["200M–400M+ silver daily", "Contribution EXP"],
        time: "15–30 min (with prep)",
        priority: "high",
        tips: "Cook in bulk, box and deliver daily. One of the best passive silver sources. Even just buying meals and boxing works.",
      },
      {
        name: "Black Spirit Daily Quests",
        description: "Various daily quests from the Black Spirit for Hunter Seals and items.",
        rewards: ["Hunter Seals", "Contribution EXP", "Silver"],
        time: "15–30 min",
        priority: "medium",
        tips: "Quick and easy. Do alongside other activities.",
      },
      {
        name: "Guild Quests (Daily/Weekly)",
        description: "Guild missions for guild funds, guild EXP, and personal rewards.",
        rewards: ["Guild Silver", "Guild EXP", "Personal silver", "Guild Skill points"],
        time: "Varies",
        priority: "medium",
        tips: "Help your guild grow. Large guild quests give more rewards but need coordination.",
      },
      {
        name: "Marni's Stones (Daily)",
        description:
          "Daily challenge to kill X mobs at a grind spot. Bonus rewards on completion.",
        rewards: ["Extra silver", "Caphras Stones", "Enhancement materials"],
        time: "Complete during regular grinding",
        priority: "medium",
        tips: "Pick these up before grinding — free extra rewards for what you're already doing.",
      },
    ],
  },
  {
    id: "lifeskill",
    title: "Life Skills & Passive Income",
    icon: Gem,
    color: "text-cyan-400",
    description:
      "Non-combat ways to make silver. Good for AFK time or when you want a break from grinding.",
    activities: [
      {
        name: "Cooking (Active/Semi-AFK)",
        description: "Cook meals for Imperial turn-ins, Cron meals for personal use, or to sell.",
        rewards: ["Silver (Imperial turn-ins)", "Contribution EXP", "Personal buffs"],
        silverPerHour: "100M–300M+ (Imperial delivery)",
        time: "Prep + AFK cook time",
        priority: "medium",
        tips: "Start with Guru cooking boxes for Imperial. Need Master+ cooking for best profits.",
      },
      {
        name: "Bartering (Active)",
        description: "Sailing trade routes exchanging items for profit. Requires a boat.",
        rewards: ["Silver", "Sea Coins (for Carrack upgrades)", "Manos accessories"],
        silverPerHour: "300M–500M+",
        time: "2–4 hour sessions",
        priority: "low",
        tips: "Great silver but requires investment in a good boat. Consider if you enjoy sailing.",
      },
      {
        name: "Gathering (Active)",
        description: "Gather materials (meat, blood, sap, etc.) for cooking/alchemy or direct sale.",
        rewards: ["Materials", "Hard/Sharp shards", "Silver", "Rare drops"],
        silverPerHour: "100M–200M+",
        time: "30 min energy dumps",
        priority: "low",
        tips: "Use Magical tools. Good for when you have full energy and limited time.",
      },
      {
        name: "Worker Empire (Passive)",
        description: "Workers gather materials from nodes automatically. Set up once, collect daily.",
        rewards: ["Materials for cooking/alchemy", "Trade items", "Passive income"],
        silverPerHour: "Passive — 50M–150M/day",
        time: "10 min setup, then passive",
        priority: "medium",
        tips: "Get Artisan+ workers on key nodes (grain, cooking honey, trace). Feed them beer.",
      },
    ],
  },
];

export function PrioritiesContent() {
  const [expanded, setExpanded] = useState<string | null>("grinding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Priorities & Activities</h1>
        <p className="text-muted-foreground">
          What to do and what you get out of it &mdash; sorted by impact
        </p>
      </div>

      {/* Priority legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-muted-foreground">High Priority — Don&apos;t skip</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="text-xs text-muted-foreground">Medium — Do when you can</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground">Low — Nice to have</span>
        </div>
      </div>

      {/* Quick summary card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Daily Checklist (at 266/262/358)</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-red-400" />
                  <span>Grind 1-2 hours (buffed) at Elvia or high-end spot</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-red-400" />
                  <span>Imperial Cooking delivery (~15 min)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-red-400" />
                  <span>Black Shrine bosses if you have tokens</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span>World bosses (if on schedule)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span>Marni Stone dailies (during grind)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span>Adventure Log progress (chip away)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic pt-1">
                Sunday: Vell boss (don&apos;t miss!) &bull; Weekly: Rift boss scrolls in 5-man party
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity categories */}
      <div className="space-y-3">
        {ACTIVITY_CATEGORIES.map((category) => (
          <Card key={category.id} className="transition-colors hover:border-primary/30">
            <CardHeader
              className="cursor-pointer py-4"
              onClick={() =>
                setExpanded(expanded === category.id ? null : category.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                  <div>
                    <CardTitle className="text-base">{category.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge variant="secondary">{category.activities.length}</Badge>
                  {expanded === category.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expanded === category.id && (
              <CardContent className="pt-0 space-y-3">
                {category.activities.map((activity) => (
                  <Card key={activity.name} className="bg-muted/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm font-semibold">
                          {activity.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {activity.silverPerHour && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              <Coins className="mr-1 h-3 w-3" />
                              {activity.silverPerHour}
                            </Badge>
                          )}
                          <Badge
                            className={`text-xs ${PRIORITY_COLORS[activity.priority]}`}
                          >
                            {activity.priority}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>

                      <div className="flex items-start gap-2">
                        <Trophy className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {activity.rewards.map((reward) => (
                            <Badge
                              key={reward}
                              variant="secondary"
                              className="text-xs"
                            >
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>

                      {activity.tips && (
                        <div className="flex items-start gap-2 pt-1 border-t border-border/50">
                          <Star className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-400/80 italic">
                            {activity.tips}
                          </p>
                        </div>
                      )}

                      {activity.yourStatus && (
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <p className="text-xs text-primary/80">
                            {activity.yourStatus}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
