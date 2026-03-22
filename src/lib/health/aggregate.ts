// Health Monitor — Aggregate validated signals by day

import type { HealthSignal, HealthDay, HealthActivity, JournalEntry } from "./types";
import { MAX_ACTIVITIES_PER_DAY, MAX_LABEL_LENGTH } from "./types";
import { validateSignal } from "./validate";

export interface AggregateStats {
  analyzed: number;
  extracted: number;
  excluded: number;
  validated: number;
}

export function aggregateByDay(
  signals: HealthSignal[],
  entries: JournalEntry[]
): { days: HealthDay[]; stats: AggregateStats } {
  const sourceMap = new Map(entries.map((e) => [e.id, e.content]));
  const dateMap = new Map(entries.map((e) => [e.id, e.localDate]));

  let extracted = 0;
  let excluded = 0;
  let validated = 0;

  const validActivities: { date: string; activity: HealthActivity }[] = [];

  for (const signal of signals) {
    extracted++;

    const sourceContent = sourceMap.get(signal.entry_id);
    if (!sourceContent) {
      console.warn(`[health:aggregate] entry_id "${signal.entry_id}" not found in source entries`);
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
    if (!date) {
      console.warn(`[health:aggregate] no date for entry_id "${signal.entry_id}"`);
      continue;
    }

    // Truncate label for UI (validation already passed)
    const label = signal.activity_text_exact.length > MAX_LABEL_LENGTH
      ? signal.activity_text_exact.slice(0, MAX_LABEL_LENGTH - 3) + "..."
      : signal.activity_text_exact;

    validActivities.push({
      date,
      activity: {
        label,
        type: signal.activity_type,
        confidence: signal.confidence as "high" | "medium",
        source_entry_id: signal.entry_id,
      },
    });
  }

  // Group by date, deduplicate, cap per day
  const dayMap = new Map<string, HealthActivity[]>();
  const dayOrder: string[] = [];

  for (const { date, activity } of validActivities) {
    if (!dayMap.has(date)) {
      dayMap.set(date, []);
      dayOrder.push(date);
    }
    const activities = dayMap.get(date)!;

    // Deduplicate: same entry + same label
    const isDup = activities.some(
      (a) => a.source_entry_id === activity.source_entry_id && a.label === activity.label
    );
    if (isDup) continue;

    // Cap activities per day
    if (activities.length >= MAX_ACTIVITIES_PER_DAY) continue;

    activities.push(activity);
  }

  // Sort chronologically
  dayOrder.sort((a, b) => {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    if (isNaN(da) || isNaN(db)) return 0;
    return da - db;
  });

  const days: HealthDay[] = dayOrder
    .filter((date) => (dayMap.get(date)?.length || 0) > 0)
    .map((date) => ({ date, activities: dayMap.get(date)! }));

  return {
    days,
    stats: { analyzed: entries.length, extracted, excluded, validated },
  };
}
