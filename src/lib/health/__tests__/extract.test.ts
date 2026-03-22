import { describe, it, expect } from "vitest";
import { extractHealthSignals } from "../extract";
import type { LLMProvider } from "../provider";
import type { JournalEntry } from "../types";

const mockEntry: JournalEntry = {
  id: "e1", content: "I did weights today", localDate: "March 22, 2026",
  localTime: "10:00 AM", createdAt: new Date(), tags: "",
};

function mockProvider(response: string | null): LLMProvider {
  return {
    name: "mock",
    ask: async () => response,
  };
}

describe("extractHealthSignals", () => {
  it("parses valid JSON response", async () => {
    const json = JSON.stringify([{
      entry_id: "e1", completed_activity: true, activity_text_exact: "did weights",
      activity_type: "strength", confidence: "high", needs_exclusion: false,
    }]);
    const { signals } = await extractHealthSignals([mockEntry], mockProvider(json));
    expect(signals).toHaveLength(1);
    expect(signals[0].activity_text_exact).toBe("did weights");
  });

  it("returns empty on null response", async () => {
    const { signals } = await extractHealthSignals([mockEntry], mockProvider(null));
    expect(signals).toHaveLength(0);
  });

  it("returns empty on malformed JSON", async () => {
    const { signals } = await extractHealthSignals([mockEntry], mockProvider("not json at all"));
    expect(signals).toHaveLength(0);
  });

  it("rejects signals with invented entry_ids", async () => {
    const json = JSON.stringify([{
      entry_id: "FAKE_ID", completed_activity: true, activity_text_exact: "did weights",
      activity_type: "strength", confidence: "high", needs_exclusion: false,
    }]);
    const { signals } = await extractHealthSignals([mockEntry], mockProvider(json));
    expect(signals).toHaveLength(0);
  });

  it("rejects signals that fail schema validation", async () => {
    const json = JSON.stringify([{
      entry_id: "e1", completed_activity: "yes", // wrong type
      activity_text_exact: "did weights", activity_type: "INVALID",
      confidence: "high", needs_exclusion: false,
    }]);
    const { signals } = await extractHealthSignals([mockEntry], mockProvider(json));
    expect(signals).toHaveLength(0);
  });

  it("handles markdown-wrapped JSON", async () => {
    const json = "```json\n" + JSON.stringify([{
      entry_id: "e1", completed_activity: true, activity_text_exact: "did weights",
      activity_type: "strength", confidence: "high", needs_exclusion: false,
    }]) + "\n```";
    const { signals } = await extractHealthSignals([mockEntry], mockProvider(json));
    expect(signals).toHaveLength(1);
  });

  it("returns rawCount for coverage calculation", async () => {
    const json = JSON.stringify([
      { entry_id: "e1", completed_activity: true, activity_text_exact: "did weights", activity_type: "strength", confidence: "high", needs_exclusion: false },
      { entry_id: "FAKE", completed_activity: true, activity_text_exact: "fake", activity_type: "sport", confidence: "high", needs_exclusion: false },
    ]);
    const { signals, rawCount } = await extractHealthSignals([mockEntry], mockProvider(json));
    expect(rawCount).toBe(2);
    expect(signals).toHaveLength(1); // FAKE rejected
  });
});
