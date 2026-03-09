import { RESET_TIMES } from "./constants";

/**
 * Get the next daily reset time (7pm EST)
 */
export function getNextDailyReset(now: Date = new Date()): Date {
  const reset = new Date(now);
  // Convert to EST offset: UTC-5 (EST) or UTC-4 (EDT)
  const estOffset = getESTOffset(now);

  // Set to today's reset time in UTC
  reset.setUTCHours(RESET_TIMES.daily.hour - estOffset, RESET_TIMES.daily.minute, 0, 0);

  // If reset already passed today, move to tomorrow
  if (reset.getTime() <= now.getTime()) {
    reset.setUTCDate(reset.getUTCDate() + 1);
  }

  return reset;
}

/**
 * Get the next weekly reset time (Wednesday 7pm EST)
 */
export function getNextWeeklyReset(now: Date = new Date()): Date {
  const reset = getNextDailyReset(now);
  const targetDay = RESET_TIMES.weekly.day; // Wednesday = 3

  while (reset.getUTCDay() !== targetDay) {
    reset.setUTCDate(reset.getUTCDate() + 1);
  }

  return reset;
}

/**
 * Get time remaining until a target date
 */
export function getTimeRemaining(target: Date, now: Date = new Date()) {
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  };
}

/**
 * Format time remaining as a string (e.g., "5h 23m")
 */
export function formatTimeRemaining(target: Date, now: Date = new Date()): string {
  const { hours, minutes, total } = getTimeRemaining(target, now);

  if (total <= 0) return "Now!";

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Get the current daily reset period string (e.g., "2026-03-09")
 */
export function getCurrentDailyPeriod(now: Date = new Date()): string {
  const estOffset = getESTOffset(now);
  const resetHourUTC = RESET_TIMES.daily.hour - estOffset;

  // If before today's reset, we're in yesterday's period
  const period = new Date(now);
  if (now.getUTCHours() < resetHourUTC) {
    period.setUTCDate(period.getUTCDate() - 1);
  }

  return period.toISOString().split("T")[0];
}

/**
 * Get the current weekly reset period string (e.g., "2026-W11")
 */
export function getCurrentWeeklyPeriod(now: Date = new Date()): string {
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.ceil(((diff / oneWeek) + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
}

/**
 * Get EST/EDT offset from UTC (EST = -5, EDT = -4)
 */
function getESTOffset(date: Date): number {
  // Simple DST check for US Eastern Time
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

  // Create a date in ET and check if it's DST
  const etDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const offset = (utcDate.getTime() - etDate.getTime()) / (1000 * 60 * 60);

  return offset;
}
