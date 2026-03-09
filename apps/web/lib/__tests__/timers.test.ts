import { describe, it, expect } from "vitest";
import {
  formatTimeRemaining,
  getCurrentDailyPeriod,
  getCurrentWeeklyPeriod,
  getNextDailyReset,
  getNextWeeklyReset,
} from "../timers";

describe("formatTimeRemaining", () => {
  it("returns 'Now!' when the target is in the past", () => {
    const now = new Date("2026-03-09T12:00:00Z");
    const target = new Date("2026-03-09T11:00:00Z");
    expect(formatTimeRemaining(target, now)).toBe("Now!");
  });

  it("returns hours and minutes format for targets under 24h away", () => {
    const now = new Date("2026-03-09T12:00:00Z");
    const target = new Date("2026-03-09T17:30:00Z"); // 5h 30m later
    expect(formatTimeRemaining(target, now)).toBe("5h 30m");
  });

  it("returns days and hours format for targets over 24h away", () => {
    const now = new Date("2026-03-09T12:00:00Z");
    const target = new Date("2026-03-11T15:00:00Z"); // 2 days 3 hours later
    expect(formatTimeRemaining(target, now)).toBe("2d 3h");
  });

  it("returns '0h 0m' style for very short remaining times", () => {
    const now = new Date("2026-03-09T12:00:00Z");
    const target = new Date("2026-03-09T12:00:30Z"); // 30 seconds later
    expect(formatTimeRemaining(target, now)).toBe("0h 0m");
  });
});

describe("getCurrentDailyPeriod", () => {
  it("returns a date string in YYYY-MM-DD format", () => {
    const result = getCurrentDailyPeriod(new Date("2026-03-09T12:00:00Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a valid date string for different inputs", () => {
    const result = getCurrentDailyPeriod(new Date("2026-01-15T05:00:00Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getCurrentWeeklyPeriod", () => {
  it("returns a week string in YYYY-Wxx format", () => {
    const result = getCurrentWeeklyPeriod(new Date("2026-03-09T12:00:00Z"));
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("returns a valid week string for different inputs", () => {
    const result = getCurrentWeeklyPeriod(new Date("2026-06-20T18:00:00Z"));
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe("getNextDailyReset", () => {
  it("returns a Date object", () => {
    const result = getNextDailyReset(new Date("2026-03-09T12:00:00Z"));
    expect(result).toBeInstanceOf(Date);
  });

  it("returns a date in the future relative to the input", () => {
    const now = new Date("2026-03-09T12:00:00Z");
    const result = getNextDailyReset(now);
    expect(result.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("getNextWeeklyReset", () => {
  it("returns a Date object", () => {
    const result = getNextWeeklyReset(new Date("2026-03-09T12:00:00Z"));
    expect(result).toBeInstanceOf(Date);
  });

  it("returns a date on a Wednesday (day 3)", () => {
    const result = getNextWeeklyReset(new Date("2026-03-09T12:00:00Z"));
    expect(result.getUTCDay()).toBe(3);
  });
});
