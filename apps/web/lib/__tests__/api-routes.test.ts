import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Verify that all API proxy route files exist and export GET handlers.
 */
const API_ROUTES = [
  "garmoth/grind-spots",
  "garmoth/news",
  "garmoth/events",
  "garmoth/coupons",
];

describe("API proxy routes", () => {
  for (const route of API_ROUTES) {
    const routeFile = path.resolve(
      __dirname,
      `../../app/api/${route}/route.ts`,
    );

    it(`${route}/route.ts exists`, () => {
      expect(fs.existsSync(routeFile)).toBe(true);
    });

    it(`${route}/route.ts exports a GET function`, () => {
      const src = fs.readFileSync(routeFile, "utf-8");
      expect(src).toMatch(/export\s+(async\s+)?function\s+GET/);
    });

    it(`${route}/route.ts fetches from api.garmoth.com`, () => {
      const src = fs.readFileSync(routeFile, "utf-8");
      expect(src).toContain("api.garmoth.com");
    });
  }
});
