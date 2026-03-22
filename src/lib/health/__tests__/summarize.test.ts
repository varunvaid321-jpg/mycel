import { describe, it, expect } from "vitest";
import { generateWeeklySummary } from "../summarize";
import type { LLMProvider } from "../provider";
import type { HealthDay } from "../types";

function mockProvider(response: string | null): LLMProvider {
  return { name: "mock", ask: async () => response };
}

const sampleDays: HealthDay[] = [
  { date: "March 21, 2026", activities: [{ label: "did weights", type: "strength", confidence: "high", source_entry_id: "e1" }] },
  { date: "March 22, 2026", activities: [{ label: "played table tennis", type: "sport", confidence: "high", source_entry_id: "e2" }] },
];

describe("generateWeeklySummary", () => {
  it("parses valid summary", async () => {
    const json = JSON.stringify({
      active_days: 2,
      pattern_note: "Strength and sport.",
      next_best_action: "Add some cardio.",
      motivation: "Keep going.",
    });
    const result = await generateWeeklySummary(sampleDays, 5, mockProvider(json));
    expect(result).not.toBeNull();
    expect(result!.active_days).toBe(2); // overridden from actual days
    expect(result!.pattern_note).toBe("Strength and sport.");
  });

  it("returns null on null response", async () => {
    const result = await generateWeeklySummary(sampleDays, 5, mockProvider(null));
    expect(result).toBeNull();
  });

  it("returns null on malformed JSON", async () => {
    const result = await generateWeeklySummary(sampleDays, 5, mockProvider("not json"));
    expect(result).toBeNull();
  });

  it("returns null on invalid shape (missing motivation)", async () => {
    const json = JSON.stringify({ active_days: 2, pattern_note: "test" });
    const result = await generateWeeklySummary(sampleDays, 5, mockProvider(json));
    expect(result).toBeNull();
  });

  it("truncates long fields", async () => {
    const json = JSON.stringify({
      active_days: 2,
      pattern_note: "a".repeat(200),
      next_best_action: "b".repeat(200),
      motivation: "c".repeat(200),
    });
    const result = await generateWeeklySummary(sampleDays, 5, mockProvider(json));
    expect(result).not.toBeNull();
    expect(result!.pattern_note.length).toBeLessThanOrEqual(120);
    expect(result!.motivation.length).toBeLessThanOrEqual(120);
  });

  it("returns null for empty days", async () => {
    const result = await generateWeeklySummary([], 0, mockProvider("anything"));
    expect(result).toBeNull();
  });
});
