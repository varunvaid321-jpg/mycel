// Health Monitor — Aggregate validated signals by day

import type { HealthSignal, HealthDay, HealthActivity, JournalEntry } from "./types";
import { validateSignal } from "./validate";

// Build a map of entry_id → source content for validation
function buildSourceMap(entries: JournalEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of entries) {
    map.set(e.id, e.content);
  }
  return map;
}

// Build a map of entry_id → localDate
function buildDateMap(entries: JournalEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of entries) {
    map.set(e.id, e.localDate);
  }
  return map;
}

export function aggregateByDay(
  signals: HealthSignal[],
  entries: JournalEntry[]
): { days: HealthDay[]; stats: { analyzed: number; extracted: number; excluded: number; validated: number } } {
  const sourceMap = buildSourceMap(entries);
  const dateMap = buildDateMap(entries);

  let extracted = 0;
  let excluded = 0;
  let validated = 0;

  // Validate each signal against source text
  const validActivities: { date: string; activity: HealthActivity }[] = [];

  for (const signal of signals) {
    extracted++;
    const sourceContent = sourceMap.get(signal.entry_id);
    if (!sourceContent) {
      excluded++;
      continue;
    }

    const validation = validateSignal(signal, sourceContent);
    if (!validation.valid) {
      excluded++;
      continue;
    }

    validated++;
    const date = dateMap.get(signal.entry_id) || "";
    validActivities.push({
      date,
      activity: {
        label: signal.activity_text_exact,
        type: signal.activity_type,
        confidence: signal.confidence as "high" | "medium",
        source_entry_id: signal.entry_id,
      },
    });
  }

  // Group by date, deduplicate
  const dayMap = new Map<string, HealthActivity[]>();
  const dayOrder: string[] = [];

  for (const { date, activity } of validActivities) {
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
      dayOrder.push(date);
    }
    const activities = dayMap.get(date)!;
    // Deduplicate: skip if same label from same entry
    const isDup = activities.some(
      (a) => a.source_entry_id === activity.source_entry_id && a.label === activity.label
    );
    if (!isDup) {
      activities.push(activity);
    }
  }

  // Sort days chronologically
  dayOrder.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const days: HealthDay[] = dayOrder
    .filter((date) => (dayMap.get(date)?.length || 0) > 0)
    .map((date) => ({
      date,
      activities: dayMap.get(date)!,
    }));

  return {
    days,
    stats: { analyzed: entries.length, extracted, excluded, validated },
  };
}
