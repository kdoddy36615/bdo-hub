import { describe, it, expect } from "vitest";
import mentorData from "../mentor-data.json";

describe("mentor-data.json", () => {
  it("imports successfully", () => {
    expect(mentorData).toBeDefined();
    expect(Array.isArray(mentorData)).toBe(true);
  });

  it("has at least 10 questions", () => {
    expect(mentorData.length).toBeGreaterThanOrEqual(10);
  });

  it("each question has id, question, tags, and answers fields", () => {
    for (const item of mentorData) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("question");
      expect(item).toHaveProperty("tags");
      expect(item).toHaveProperty("answers");
      expect(typeof item.id).toBe("string");
      expect(typeof item.question).toBe("string");
      expect(Array.isArray(item.tags)).toBe(true);
      expect(Array.isArray(item.answers)).toBe(true);
    }
  });

  it("all IDs are unique", () => {
    const ids = mentorData.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
