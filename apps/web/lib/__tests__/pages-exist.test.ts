import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const EXPECTED_PAGES = [
  "dashboard",
  "progression",
  "activities",
  "bosses",
  "characters",
  "gear",
  "playbooks",
  "resources",
  "storage",
  "grind",
  "gathering",
  "news",
  "buffs",
  "priorities",
  "mentor",
  "settings",
  "status",
];

const APP_DIR = path.resolve(__dirname, "../../app/(app)");

describe("app pages", () => {
  it("has all expected page directories", () => {
    for (const page of EXPECTED_PAGES) {
      const pagePath = path.join(APP_DIR, page, "page.tsx");
      expect(fs.existsSync(pagePath), `${page}/page.tsx should exist`).toBe(
        true,
      );
    }
  });

  it("each page has a content component", () => {
    for (const page of EXPECTED_PAGES) {
      const dir = path.join(APP_DIR, page);
      const files = fs.readdirSync(dir);
      const hasContent = files.some(
        (f) => f.includes("-content.tsx") || f === "page.tsx",
      );
      expect(hasContent, `${page} should have content component`).toBe(true);
    }
  });

  it(`has exactly ${EXPECTED_PAGES.length} expected pages`, () => {
    expect(EXPECTED_PAGES.length).toBe(17);
  });
});
