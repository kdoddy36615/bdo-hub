import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Extracts NAV_ITEMS hrefs from the sidebar source file.
 * This avoids importing the component (which needs React/Next.js context).
 */
function getNavHrefs(): string[] {
  const sidebarPath = path.resolve(
    __dirname,
    "../../components/layout/app-sidebar.tsx",
  );
  const src = fs.readFileSync(sidebarPath, "utf-8");
  const matches = [...src.matchAll(/href:\s*"(\/[^"]+)"/g)];
  return matches.map((m) => m[1]);
}

/**
 * Gets all page directories under (app)/.
 */
function getPageRoutes(): string[] {
  const appDir = path.resolve(__dirname, "../../app/(app)");
  return fs
    .readdirSync(appDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => {
      const pagePath = path.join(appDir, d.name, "page.tsx");
      return fs.existsSync(pagePath);
    })
    .map((d) => `/${d.name}`);
}

describe("navigation items", () => {
  const navHrefs = getNavHrefs();
  const pageRoutes = getPageRoutes();

  it("has no duplicate hrefs", () => {
    expect(new Set(navHrefs).size).toBe(navHrefs.length);
  });

  it("every nav href has a corresponding page route", () => {
    for (const href of navHrefs) {
      expect(pageRoutes).toContain(href);
    }
  });

  it("has at least 10 nav items", () => {
    expect(navHrefs.length).toBeGreaterThanOrEqual(10);
  });

  it("dashboard is the first nav item", () => {
    expect(navHrefs[0]).toBe("/dashboard");
  });

  it("settings is the last nav item", () => {
    expect(navHrefs[navHrefs.length - 1]).toBe("/settings");
  });
});
