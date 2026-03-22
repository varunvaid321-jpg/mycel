import { describe, it, expect } from "vitest";
import { validateSignal } from "../validate";
import type { HealthSignal } from "../types";
import { GOLDEN_DATASET } from "./golden-dataset";

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

describe("validateSignal — phrase grounding", () => {
  it("accepts exact substring match", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "did weights" }), "I did weights at the gym");
    expect(r.valid).toBe(true);
  });

  it("accepts near-contiguous match (1-2 word gap)", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "played table tennis" }), "We played some table tennis");
    expect(r.valid).toBe(true);
  });

  it("rejects fabricated phrases not in source", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "chest and triceps at gym" }), "went to gym");
    expect(r.valid).toBe(false);
  });

  it("rejects generic label not present as phrase", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "gym workout session" }), "Good gym day");
    expect(r.valid).toBe(false);
  });

  it("accepts 'good gym day' verbatim", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "good gym day", activity_type: "unknown" }), "Good gym day");
    expect(r.valid).toBe(true);
  });
});

describe("validateSignal — intention verb rejection", () => {
  it("rejects label with 'learn'", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "learn scuba diving" }), "learn scuba diving this summer");
    expect(r.valid).toBe(false);
  });

  it("rejects label with 'planning'", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "planning to try workout" }), "planning to try a new workout");
    expect(r.valid).toBe(false);
  });

  it("accepts label without intention verbs", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "completed 10 push-ups" }), "I completed 10 push-ups at 10 am");
    expect(r.valid).toBe(true);
  });
});

describe("validateSignal — third person rejection", () => {
  it("rejects Kyna at dance", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "dance" }), "Kyna at dance");
    expect(r.valid).toBe(false);
  });

  it("rejects kids swimming entry", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "swimming" }), "I asked Puja to ensure Kyna is very active physically, swimming, soccer");
    expect(r.valid).toBe(false);
  });

  it("accepts 'we played' (first person included)", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "played table tennis" }), "We played table tennis Krish and me");
    expect(r.valid).toBe(true);
  });
});

describe("validateSignal — basic filters", () => {
  it("rejects excluded signals", () => {
    const r = validateSignal(makeSignal({ needs_exclusion: true, exclusion_reason: "intention_only" }), "anything");
    expect(r.valid).toBe(false);
  });

  it("rejects low confidence", () => {
    const r = validateSignal(makeSignal({ confidence: "low" }), "did weights");
    expect(r.valid).toBe(false);
  });

  it("rejects non-completed", () => {
    const r = validateSignal(makeSignal({ completed_activity: false }), "want to run");
    expect(r.valid).toBe(false);
  });

  it("rejects empty label", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "" }), "some content");
    expect(r.valid).toBe(false);
  });

  it("rejects medium confidence + short label", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "gym", confidence: "medium" }), "at the gym");
    expect(r.valid).toBe(false);
  });

  it("accepts medium confidence + longer grounded label", () => {
    const r = validateSignal(makeSignal({ activity_text_exact: "walked back from gym", confidence: "medium" }), "I walked back from the gym");
    expect(r.valid).toBe(true);
  });
});

describe("golden dataset — validation rules", () => {
  const excludeEntries = GOLDEN_DATASET.filter((g) => !g.shouldInclude);

  for (const entry of excludeEntries) {
    if (entry.excludeReason === "no_health_signal") continue; // Groq shouldn't extract these at all

    it(`rejects: "${entry.content.slice(0, 50)}..."`, () => {
      // Simulate Groq wrongly returning this as completed
      // Use a realistic label the LLM might generate
      let fakeLabel = entry.content.slice(0, 40);
      if (entry.excludeReason === "intention_only") {
        // LLM might extract the intention phrase itself
        fakeLabel = entry.content.match(/\b(need|want|should|learn|planning|try)\b.*$/i)?.[0]?.slice(0, 30) || fakeLabel;
      }

      const signal = makeSignal({
        entry_id: entry.id,
        activity_text_exact: fakeLabel,
        completed_activity: true,
        confidence: "high",
      });
      const result = validateSignal(signal, entry.content);
      expect(result.valid).toBe(false);
    });
  }
});
