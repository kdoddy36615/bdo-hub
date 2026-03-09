import { describe, it, expect } from "vitest";
import { useSupabaseFetch } from "../hooks/use-supabase-fetch";

describe("useSupabaseFetch", () => {
  it("exports a function", () => {
    expect(typeof useSupabaseFetch).toBe("function");
  });
});
