import { describe, it, expect } from "vitest";
import { THEMES, DEFAULT_THEME, DARK_THEME_IDS, getThemeConfig } from "../themes";

describe("themes", () => {
  it("has exactly 12 themes", () => {
    expect(THEMES).toHaveLength(12);
  });

  it("has 6 dark and 6 light themes", () => {
    const dark = THEMES.filter((t) => t.mode === "dark");
    const light = THEMES.filter((t) => t.mode === "light");
    expect(dark).toHaveLength(6);
    expect(light).toHaveLength(6);
  });

  it("has unique IDs", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("default theme exists in themes list", () => {
    expect(THEMES.find((t) => t.id === DEFAULT_THEME)).toBeDefined();
  });

  it("DARK_THEME_IDS matches dark themes", () => {
    const expected = THEMES.filter((t) => t.mode === "dark").map((t) => t.id);
    expect(DARK_THEME_IDS).toEqual(expected);
  });

  it("getThemeConfig returns correct theme", () => {
    const config = getThemeConfig("crimson");
    expect(config.id).toBe("crimson");
    expect(config.name).toBe("Crimson");
    expect(config.mode).toBe("dark");
  });

  it("getThemeConfig falls back to first theme for unknown ID", () => {
    const config = getThemeConfig("nonexistent");
    expect(config.id).toBe(THEMES[0].id);
  });

  it("all themes have valid preview colors (hex format)", () => {
    for (const theme of THEMES) {
      for (const key of ["bg", "card", "primary", "accent"] as const) {
        expect(theme.preview[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });
});
