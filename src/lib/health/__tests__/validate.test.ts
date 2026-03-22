import { describe, it, expect } from "vitest";
import { validateSignal } from "../validate";
import type { HealthSignal } from "../types";

function makeSignal(overrides: Partial<HealthSignal> = {}): HealthSignal {
  return {
    entry_id: "test-1",
    completed_activity: true,
    activity_text_exact: "did weights",
    activity_type: "strength",
    confidence: "high",
    needs_exclusion: false,
    ...overrides,
  };
}

describe("validateSignal", () => {
  it("accepts grounded activity", () => {
    const result = validateSignal(makeSignal({ activity_text_exact: "did weights" }), "I did weights at the gym");
    expect(result.valid).toBe(true);
  });

  it("rejects fabricated words", () => {
    const result = validateSignal(
      makeSignal({ activity_text_exact: "chest and triceps at gym" }),
      "went to gym"
    );
    expect(result.valid).toBe(false);
  });

  it("rejects excluded signals", () => {
    const result = validateSignal(
      makeSignal({ needs_exclusion: true, exclusion_reason: "intention_only" }),
      "need to do pushups"
    );
    expect(result.valid).toBe(false);
  });

  it("rejects low confidence", () => {
    const result = validateSignal(makeSignal({ confidence: "low" }), "maybe walked");
    expect(result.valid).toBe(false);
  });

  it("rejects non-completed activities", () => {
    const result = validateSignal(makeSignal({ completed_activity: false }), "want to run");
    expect(result.valid).toBe(false);
  });

  it("accepts 'good gym day' without inferring details", () => {
    const result = validateSignal(
      makeSignal({ activity_text_exact: "good gym day", activity_type: "unknown" }),
      "Good gym day"
    );
    expect(result.valid).toBe(true);
  });

  it("rejects empty label", () => {
    const result = validateSignal(makeSignal({ activity_text_exact: "" }), "some content");
    expect(result.valid).toBe(false);
  });
});
