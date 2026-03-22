// Health Monitor — Public API
// Single entry point for the health extraction pipeline

import { getProvider } from "./provider";
import { extractHealthSignals } from "./extract";
import { aggregateByDay } from "./aggregate";
import { generateWeeklySummary } from "./summarize";
import type { JournalEntry, HealthMonitorOutput } from "./types";

export type { HealthMonitorOutput, HealthDay, WeekSummary, HealthActivity } from "./types";

/**
 * Generate the weekly health monitor from journal entries.
 *
 * @param weekEntries - Entries from the last 7 days
 * @param monthEntries - Entries from the last 30 days (for pattern context)
 * @returns Structured health monitor output, or null if no provider or no activities
 */
export async function generateWeeklyHealthMonitor(
  weekEntries: JournalEntry[],
  monthEntries: JournalEntry[]
): Promise<HealthMonitorOutput | null> {
  const provider = getProvider();
  if (!provider) {
    console.warn("[health] No LLM provider available (missing GROQ_API_KEY and CF keys)");
    return null;
  }

  // Filter out imported entries
  const filteredWeek = weekEntries.filter(
    (e) => !e.tags?.toLowerCase().includes("imported") && !e.tags?.toLowerCase().includes("chatgpt")
  );
  const filteredMonth = monthEntries.filter(
    (e) => !e.tags?.toLowerCase().includes("imported") && !e.tags?.toLowerCase().includes("chatgpt")
  );

  if (filteredWeek.length === 0) {
    console.log("[health] No entries this week");
    return null;
  }

  console.log(`[health] Analyzing ${filteredWeek.length} week entries, ${filteredMonth.length} month entries`);

  // Step 1: Extract health signals from this week's entries
  // Batch in groups of 10 to keep prompt size manageable
  const allSignals = [];
  for (let i = 0; i < filteredWeek.length; i += 10) {
    const batch = filteredWeek.slice(i, i + 10);
    const signals = await extractHealthSignals(batch, provider);
    allSignals.push(...signals);
  }

  // Step 2: Validate and aggregate by day
  const { days, stats } = aggregateByDay(allSignals, filteredWeek);

  console.log(
    `[health] analyzed ${stats.analyzed}, extracted ${stats.extracted}, excluded ${stats.excluded}, validated ${stats.validated}`
  );

  if (days.length === 0) {
    console.log("[health] No active days found");
    return null;
  }

  console.log(`[health] ${days.length} active days: ${days.map((d) => d.date).join(", ")}`);

  // Step 3: Count month-wide active days for context
  // Quick extraction on month entries — just count days with activity, don't need full pipeline
  let monthActiveDays = days.length; // start with this week's count
  const olderEntries = filteredMonth.filter(
    (e) => !filteredWeek.some((w) => w.id === e.id)
  );
  if (olderEntries.length > 0) {
    const olderSignals = await extractHealthSignals(olderEntries.slice(0, 30), provider);
    const { days: olderDays } = aggregateByDay(olderSignals, olderEntries);
    monthActiveDays += olderDays.length;
  }

  // Step 4: Generate weekly summary
  const weekSummary = await generateWeeklySummary(days, monthActiveDays, provider);

  return { days, week_summary: weekSummary };
}
