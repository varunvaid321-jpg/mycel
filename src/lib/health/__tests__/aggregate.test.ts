import { describe, it, expect } from "vitest";
import { aggregateByDay } from "../aggregate";
import type { HealthSignal, JournalEntry } from "../types";

const mockEntries: JournalEntry[] = [
  { id: "e1", content: "I did weights and walking", localDate: "March 21, 2026", localTime: "10:00 AM", createdAt: new Date("2026-03-21"), tags: "" },
  { id: "e2", content: "We played table tennis", localDate: "March 21, 2026", localTime: "3:00 PM", createdAt: new Date("2026-03-21"), tags: "" },
  { id: "e3", content: "I completed 10 push-ups", localDate: "March 22, 2026", localTime: "10:00 AM", createdAt: new Date("2026-03-22"), tags: "" },
  { id: "e4", content: "Kyna at dance", localDate: "March 22, 2026", localTime: "4:00 PM", createdAt: new Date("2026-03-22"), tags: "" },
];

describe("aggregateByDay", () => {
  it("groups activities by date", () => {
    const signals: HealthSignal[] = [
      { entry_id: "e1", completed_activity: true, activity_text_exact: "did weights and walking", activity_type: "mixed", confidence: "high", needs_exclusion: false },
      { entry_id: "e2", completed_activity: true, activity_text_exact: "played table tennis", activity_type: "sport", confidence: "high", needs_exclusion: false },
      { entry_id: "e3", completed_activity: true, activity_text_exact: "completed 10 push-ups", activity_type: "strength", confidence: "high", needs_exclusion: false },
    ];

    const { days, stats } = aggregateByDay(signals, mockEntries);
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe("March 21, 2026");
    expect(days[0].activities).toHaveLength(2);
    expect(days[1].date).toBe("March 22, 2026");
    expect(days[1].activities).toHaveLength(1);
    expect(stats.validated).toBe(3);
  });

  it("excludes third-person signals", () => {
    const signals: HealthSignal[] = [
      { entry_id: "e4", completed_activity: false, activity_text_exact: "Kyna at dance", activity_type: "sport", confidence: "medium", needs_exclusion: true, exclusion_reason: "third_person_only" },
    ];

    const { days, stats } = aggregateByDay(signals, mockEntries);
    expect(days).toHaveLength(0);
    expect(stats.excluded).toBe(1);
  });

  it("deduplicates same label from same entry", () => {
    const signals: HealthSignal[] = [
      { entry_id: "e1", completed_activity: true, activity_text_exact: "did weights", activity_type: "strength", confidence: "high", needs_exclusion: false },
      { entry_id: "e1", completed_activity: true, activity_text_exact: "did weights", activity_type: "strength", confidence: "high", needs_exclusion: false },
    ];

    const { days } = aggregateByDay(signals, mockEntries);
    expect(days[0].activities).toHaveLength(1);
  });

  it("returns empty days array when all signals excluded", () => {
    const signals: HealthSignal[] = [
      { entry_id: "e1", completed_activity: false, activity_text_exact: "", activity_type: "unknown", confidence: "low", needs_exclusion: true, exclusion_reason: "no_health_signal" },
    ];

    const { days } = aggregateByDay(signals, mockEntries);
    expect(days).toHaveLength(0);
  });
});
