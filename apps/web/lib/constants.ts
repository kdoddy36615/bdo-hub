export const BDO_CLASSES = [
  "Warrior", "Ranger", "Sorceress", "Berserker", "Tamer",
  "Musa", "Maehwa", "Valkyrie", "Kunoichi", "Ninja",
  "Wizard", "Witch", "Dark Knight", "Striker", "Mystic",
  "Lahn", "Archer", "Shai", "Guardian", "Hashashin",
  "Nova", "Sage", "Corsair", "Drakania", "Woosa",
  "Maegu", "Scholar", "Dosa",
] as const;

export type BdoClass = (typeof BDO_CLASSES)[number];

export const RESET_TIMES = {
  daily: { hour: 19, minute: 0, timezone: "America/New_York" }, // 7pm EST
  weekly: { day: 3, hour: 19, minute: 0, timezone: "America/New_York" }, // Wednesday 7pm EST
  maintenance: { day: 3, hour: 23, minute: 0, timezone: "America/New_York" }, // Wednesday 11pm EST (typical)
} as const;

export const BOSS_PRIORITY_COLORS = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-zinc-400",
} as const;

export const STATUS_COLORS = {
  not_started: "bg-zinc-700",
  in_progress: "bg-blue-600",
  completed: "bg-green-600",
  skipped: "bg-zinc-500",
} as const;

export const PRIORITY_COLORS = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-zinc-500",
} as const;

export const DEFAULT_STORAGE_LAYOUT = [
  { tab: 1, label: "Enhancement Materials" },
  { tab: 2, label: "Combat Buffs" },
  { tab: 3, label: "Food / Elixirs" },
  { tab: 4, label: "Gear Storage" },
  { tab: 5, label: "Worker / Contribution Items" },
  { tab: 6, label: "World Boss Drops" },
  { tab: 7, label: "Accessory Materials" },
  { tab: 8, label: "Lifeskill Materials" },
  { tab: 9, label: "Marketplace Items" },
  { tab: 10, label: "Temporary / Unknown Items" },
] as const;

export const ADVENTURE_JOURNALS = [
  "Igor Bartali Log",
  "Barrier of Infestation",
  "A Gift for Papu",
  "Mother's Warning",
  "LoML Ruler of Taebaek",
  "LoML Dokebi's Gift",
  "10th Anniversary Journal",
] as const;
