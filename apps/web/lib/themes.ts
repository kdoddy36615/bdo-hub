export interface ThemeConfig {
  id: string;
  name: string;
  mode: "dark" | "light";
  preview: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
  };
}

export const THEMES: ThemeConfig[] = [
  // -- Dark themes --
  {
    id: "midnight",
    name: "Midnight",
    mode: "dark",
    preview: { bg: "#0a0a0a", card: "#161622", primary: "#6366f1", accent: "#222233" },
  },
  {
    id: "crimson",
    name: "Crimson",
    mode: "dark",
    preview: { bg: "#1e1214", card: "#2c1c1e", primary: "#e05555", accent: "#3a2225" },
  },
  {
    id: "ocean",
    name: "Ocean",
    mode: "dark",
    preview: { bg: "#121620", card: "#1a2030", primary: "#4a90d9", accent: "#1e2a40" },
  },
  {
    id: "forest",
    name: "Forest",
    mode: "dark",
    preview: { bg: "#121c16", card: "#1a2a1e", primary: "#4ac080", accent: "#1e3525" },
  },
  {
    id: "violet",
    name: "Violet",
    mode: "dark",
    preview: { bg: "#18121c", card: "#241a2e", primary: "#9a5ae0", accent: "#2e1e3a" },
  },
  {
    id: "oled",
    name: "OLED Black",
    mode: "dark",
    preview: { bg: "#000000", card: "#0c0c0c", primary: "#ffffff", accent: "#1a1a1a" },
  },
  // -- Light themes --
  {
    id: "dawn",
    name: "Dawn",
    mode: "light",
    preview: { bg: "#ffffff", card: "#ffffff", primary: "#1a1a1a", accent: "#f5f5f5" },
  },
  {
    id: "rose",
    name: "Rose",
    mode: "light",
    preview: { bg: "#fef5f7", card: "#ffffff", primary: "#d94070", accent: "#fce8ee" },
  },
  {
    id: "amber",
    name: "Amber",
    mode: "light",
    preview: { bg: "#fefaf2", card: "#ffffff", primary: "#c07820", accent: "#fdf0d8" },
  },
  {
    id: "sage",
    name: "Sage",
    mode: "light",
    preview: { bg: "#f2faf6", card: "#ffffff", primary: "#2a8060", accent: "#e2f5ec" },
  },
  {
    id: "nord",
    name: "Nord",
    mode: "light",
    preview: { bg: "#f2f6fa", card: "#ffffff", primary: "#3868a8", accent: "#e2ecf6" },
  },
  {
    id: "sand",
    name: "Sand",
    mode: "light",
    preview: { bg: "#faf8f2", card: "#ffffff", primary: "#8a7050", accent: "#f0ece2" },
  },
];

export const DEFAULT_THEME = "midnight";

export const DARK_THEME_IDS = THEMES.filter((t) => t.mode === "dark").map((t) => t.id);

export function getThemeConfig(id: string): ThemeConfig {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
