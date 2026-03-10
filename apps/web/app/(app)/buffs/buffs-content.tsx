"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Shield,
  Swords,
  Church,
  UtensilsCrossed,
  FlaskConical,
  Building2,
  Scroll,
  Users,
  Star,
  Clock,
  Coins,
  MapPin,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

type Section = "guild" | "church" | "food" | "elixirs" | "villa" | "other";

interface BuffItem {
  name: string;
  effect: string;
  how: string;
  duration?: string;
  cost?: string;
  tip?: string;
}

interface BuffSection {
  id: Section;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  buffs: BuffItem[];
}

const BUFF_SECTIONS: BuffSection[] = [
  {
    id: "guild",
    title: "Guild Buffs",
    icon: Users,
    color: "text-blue-400",
    description: "Buffs from your guild. Passive buffs are always active; active buffs need an officer to cast.",
    buffs: [
      {
        name: "Passive Guild Skills",
        effect: "Max HP, AP, DP, Accuracy, Damage Reduction, Life Skill EXP, Combat EXP, Gathering, Fishing, Luck, Item Drop Rate, and more",
        how: "Automatically applied when your guild levels up and the Guild Master invests skill points. All contracted members receive these.",
        tip: "These are always on — you don't need to do anything. Just make sure you have a guild contract active.",
      },
      {
        name: "State of Perseverance",
        effect: "+5 AP, +5 DP, +5% Combat EXP, +5% Skill EXP, +5% Life Skill EXP",
        how: "Request from Guild Master or Officers. They use a 'Pledge of Blood' item (3k silver from guild store).",
        duration: "5 hours (can request again after it expires)",
        tip: "Ask your guild officers to pop this before grinding. It's free basically — the guild just needs silver in the bank.",
      },
      {
        name: "Other Active Guild Buffs",
        effect: "Various combat bonuses (AP Against Monsters, Resistance, etc.)",
        how: "Officers activate using Pledge of Blood. Different buffs cost different amounts of guild funds.",
        tip: "Active buffs work across servers as of 2025. They apply to your whole family now.",
      },
    ],
  },
  {
    id: "church",
    title: "Church Buffs",
    icon: Church,
    color: "text-yellow-400",
    description: "Three stackable buffs from church NPCs. Mandatory for both PvP and PvE. They don't disappear on death.",
    buffs: [
      {
        name: "Blessing of Attack (Valor)",
        effect: "All AP +8, All Accuracy +8",
        how: "Purchase from church NPC in any major city or from your campsite tent",
        duration: "2 hours (3M silver) or 5 hours (10M silver)",
        cost: "3M / 10M silver, or 25 / 80 Sangpyeong Coins",
      },
      {
        name: "Blessing of Protection",
        effect: "All Damage Reduction +8, Max HP +150",
        how: "Same church NPCs or campsite tent",
        duration: "2 hours (3M silver) or 5 hours (10M silver)",
        cost: "3M / 10M silver, or 25 / 80 Sangpyeong Coins",
      },
      {
        name: "Blessing of Experience (Growth)",
        effect: "Combat EXP +15%, Skill EXP +15%",
        how: "Same church NPCs or campsite tent",
        duration: "2 hours (3M silver) or 5 hours (10M silver)",
        cost: "3M / 10M silver, or 25 / 80 Sangpyeong Coins",
      },
    ],
  },
  {
    id: "food",
    title: "Food Buffs",
    icon: UtensilsCrossed,
    color: "text-green-400",
    description: "Two food buff slots: basic meal rotation (Menu 1) and Cron meals (Menu 2). They stack.",
    buffs: [
      {
        name: "Basic Meal Rotation (Menu 1)",
        effect: "General combat stats + Health level-ups (more HP long-term)",
        how: "Cycle through: Serendia Meal → Kama's Meal → King of Meal → Valencia Meal. Buy from Central Market or cook them.",
        duration: "30 minutes each",
        tip: "This rotation levels your Health faster than Cron meals. Great for newer characters that need HP.",
      },
      {
        name: "Exquisite Cron Meal (Menu 2)",
        effect: "AP +12, DP +12, All Accuracy +15, Damage Reduction +6, Max HP +150, Attack/Cast Speed +2, and more",
        how: "Buy from Central Market (most common PvP food)",
        duration: "120 minutes",
        tip: "Best all-around combat food. Use this for PvP and serious PvE grinding.",
      },
      {
        name: "Energizing Cron Meal (Menu 2)",
        effect: "Extra AP Against Monsters +25, Monster Damage Reduction +15, plus base combat stats",
        how: "Buy from Central Market",
        duration: "120 minutes",
        tip: "Better than Exquisite for pure PvE grinding. More monster damage and survivability.",
      },
      {
        name: "Simple Cron Meal (Menu 2)",
        effect: "Combat EXP +20%, Skill EXP +10%, plus base combat stats",
        how: "Buy from Central Market",
        duration: "120 minutes",
        tip: "Use when leveling a character. Not for grinding or PvP.",
      },
    ],
  },
  {
    id: "elixirs",
    title: "Elixirs & Draughts",
    icon: FlaskConical,
    color: "text-purple-400",
    description: "Draughts are the big ones — crafted from combining multiple elixirs. Pick PvE or PvP draught based on your activity.",
    buffs: [
      {
        name: "Beast Draught (PvE)",
        effect: "Extra AP vs Monsters +30, All Accuracy +15, Attack Speed +2, Max HP +200, Combat EXP +15%, Skill EXP +10%",
        how: "Craft via Simple Alchemy from lower elixirs, or buy from Central Market",
        duration: "15 minutes",
        tip: "THE PvE draught. Use this every grind session. It's expensive but the monster AP is huge.",
      },
      {
        name: "Giant Draught (PvP)",
        effect: "All AP +15, Ignore All Resistance +10%, All Accuracy +15, Attack Speed +2, Max HP +200",
        how: "Craft or buy from Central Market",
        duration: "15 minutes",
        tip: "For PvP only. The AP and resistance ignore make a big difference in fights.",
      },
      {
        name: "Khalk's Elixir",
        effect: "All Resistance +10%, All Damage Reduction +15",
        how: "Buy from Central Market (relatively expensive)",
        duration: "8 minutes",
        tip: "Pop this in PvP for extra tankiness. Short duration so time it right.",
      },
      {
        name: "Perfume of Courage",
        effect: "Ignore All Resistance +10%, Critical Hit Damage +5%",
        how: "Buy from Central Market",
        duration: "15 minutes",
        tip: "Pairs great with Giant Draught for PvP. More resistance penetration.",
      },
    ],
  },
  {
    id: "villa",
    title: "Villa Buffs",
    icon: Building2,
    color: "text-amber-400",
    description: "Villa buffs from desert villas. Need a Villa Invitation (10M silver/7 days or from Pearl Shop). Apply via campsite tent anywhere.",
    buffs: [
      {
        name: "Body Enhancement (Skill & EXP)",
        effect: "Combat EXP +10%, Skill EXP +10%",
        how: "Visit a villa NPC or use campsite tent with Villa Invitation active",
        duration: "180 minutes",
        cost: "Villa Invitation: 10M silver/week or Pearl Shop",
        tip: "As of 2025, villa buffs were consolidated. This replaces the old separate skill/exp buffs.",
      },
      {
        name: "Kunid's (AP Buff)",
        effect: "All AP +10",
        how: "Kunid's Villa or campsite tent",
        duration: "180 minutes",
        tip: "One of the 3 must-have villas. AP, DP, and EXP villas don't overlap.",
      },
      {
        name: "Atosa's (DP Buff)",
        effect: "All Damage Reduction +10",
        how: "Atosa's Villa or campsite tent",
        duration: "180 minutes",
        tip: "Stack with Kunid's — they don't conflict.",
      },
      {
        name: "Kiyak's (Resistance)",
        effect: "All Resistance +10%, Ignore All Resistance +5%",
        how: "Kiyak's Villa or campsite tent",
        duration: "180 minutes",
        tip: "Third of the recommended trio. Good for both PvP and general grinding safety.",
      },
    ],
  },
  {
    id: "other",
    title: "Other Buffs & Scrolls",
    icon: Scroll,
    color: "text-cyan-400",
    description: "Miscellaneous buffs from scrolls, items, and other sources.",
    buffs: [
      {
        name: "Book of Combat",
        effect: "Combat EXP +100% (regular) or +200% (advanced)",
        how: "Buy from Central Market, Pearl Shop (F3), or events",
        duration: "1 hour (regular) / 30 min (advanced)",
        tip: "Expensive but massive EXP boost. Save for when you have all other buffs running too.",
      },
      {
        name: "Daily Mercenary Scroll (Agris Fever)",
        effect: "Increased trash loot from grinding",
        how: "Press Y → Scroll tab. Accumulates daily, stacks up to 3. Combine scrolls for Agris points.",
        tip: "Use Agris at high-end grind spots for max silver value. Don't waste it at low spots.",
      },
      {
        name: "Campsite Tent Buffs",
        effect: "Access to church buffs, villa buffs, and repair from anywhere",
        how: "Pearl Shop item (permanent). Place tent with F key anywhere in the open world.",
        tip: "One of the best Pearl Shop purchases. Lets you rebuff and repair mid-grind without going to town.",
      },
      {
        name: "Outfit EXP Buff",
        effect: "Combat EXP +10%, Skill EXP +10%",
        how: "Equip any Pearl Shop outfit (costume)",
        tip: "If you own any costume, make sure it's equipped for the free EXP.",
      },
      {
        name: "Gift From J (Loyalty)",
        effect: "Item Collection Scroll +100% drop rate",
        how: "Redeem through Loyalties shop (daily login currency)",
        duration: "1 hour",
        tip: "Free drop rate buff from loyalties. Stack with Item Drop scrolls.",
      },
    ],
  },
];

export function BuffsContent() {
  const [expanded, setExpanded] = useState<Section | null>("guild");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buffs & Guides</h1>
        <p className="text-muted-foreground">
          All the buffs you should be running &mdash; what they do and how to get them
        </p>
      </div>

      {/* Quick reference banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Recommended PvE Grind Stack</p>
              <p className="text-xs text-muted-foreground mt-1">
                Energizing Cron Meal + Beast Draught + All 3 Church Buffs + State of Perseverance + Villa Buffs (Kunid + Atosa + Kiyak) + Agris Fever
              </p>
              <p className="text-sm font-medium mt-3">Recommended PvP Stack</p>
              <p className="text-xs text-muted-foreground mt-1">
                Exquisite Cron Meal + Giant Draught + Perfume of Courage + Khalk's Elixir + All 3 Church Buffs + Villa Buffs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buff sections */}
      <div className="space-y-3">
        {BUFF_SECTIONS.map((section) => (
          <Card key={section.id} className="transition-colors hover:border-primary/30">
            <CardHeader
              className="cursor-pointer py-4"
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <section.icon className={`h-5 w-5 ${section.color}`} />
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge variant="secondary">{section.buffs.length}</Badge>
                  {expanded === section.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expanded === section.id && (
              <CardContent className="pt-0 space-y-3">
                {section.buffs.map((buff) => (
                  <Card key={buff.name} className="bg-muted/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{buff.name}</span>
                        {buff.duration && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            {buff.duration}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-start gap-2">
                        <Swords className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-green-400">{buff.effect}</p>
                      </div>

                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{buff.how}</p>
                      </div>

                      {buff.cost && (
                        <div className="flex items-start gap-2">
                          <Coins className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-400">{buff.cost}</p>
                        </div>
                      )}

                      {buff.tip && (
                        <div className="flex items-start gap-2 pt-1 border-t border-border/50">
                          <Star className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-400/80 italic">{buff.tip}</p>
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

      {/* Sources */}
      <Card className="bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Sources:{" "}
            <a href="https://blackdesertonline.github.io/supporter/grindingbuffs.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BDO Supporters Buff Guide</a>
            {" / "}
            <a href="https://www.blackdesertfoundry.com/church-buff-locations-guide/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BDFoundry Church Buffs</a>
            {" / "}
            <a href="https://www.blackdesertfoundry.com/guilds-guide/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BDFoundry Guilds Guide</a>
            {" / "}
            <a href="https://garmoth.com/consumable-planner/user" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Garmoth Consumable Planner</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
