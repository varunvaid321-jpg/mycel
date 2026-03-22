// Health Monitor — Public API with caching and coverage threshold

import { getProvider } from "./provider";
import { extractHealthSignals } from "./extract";
import { aggregateByDay } from "./aggregate";
import { generateWeeklySummary } from "./summarize";
import { isImportedEntry, PIPELINE_VERSION, COVERAGE_THRESHOLD } from "./types";
import type { JournalEntry, HealthMonitorOutput } from "./types";

export type { HealthMonitorOutput, HealthDay, WeekSummary, HealthActivity } from "./types";

// ── Cache ──
let cachedHealth: HealthMonitorOutput | null = null;
let cachedKey = "";
let cachedAt = 0;
let cachedIsNull = false;
const CACHE_TTL = 10 * 60 * 1000;      // 10 min for valid results
const NULL_CACHE_TTL = 3 * 60 * 1000;   // 3 min for failures

function buildCacheKey(entries: JournalEntry[]): string {
  const count = entries.length;
  const latestUpdate = entries.length > 0
    ? Math.max(...entries.map((e) => (e.updatedAt || e.createdAt).getTime()))
    : 0;
  return `${count}:${latestUpdate}:${PIPELINE_VERSION}`;
}

export async function generateWeeklyHealthMonitor(
  weekEntries: JournalEntry[],
  monthEntries: JournalEntry[]
): Promise<HealthMonitorOutput | null> {
  // Filter imported/chatgpt entries using exact tag match
  const filteredWeek = weekEntries.filter((e) => !isImportedEntry(e));
  const filteredMonth = monthEntries.filter((e) => !isImportedEntry(e));

  // Check cache
  const key = buildCacheKey(filteredWeek);
  const now = Date.now();
  const ttl = cachedIsNull ? NULL_CACHE_TTL : CACHE_TTL;
  if (key === cachedKey && now - cachedAt < ttl) {
    console.log(`[health] cache HIT (${cachedIsNull ? "null" : "valid"})`);
    return cachedHealth;
  }

  const provider = getProvider();
  if (!provider) {
    console.warn("[health] No LLM provider (missing GROQ_API_KEY)");
    cachedHealth = null; cachedKey = key; cachedAt = now; cachedIsNull = true;
    return null;
  }

  if (filteredWeek.length === 0) {
    console.log("[health] No entries this week");
    cachedHealth = null; cachedKey = key; cachedAt = now; cachedIsNull = true;
    return null;
  }

  console.log(`[health] Analyzing ${filteredWeek.length} week entries, ${filteredMonth.length} month context`);

  try {
    // Extract health signals (batched)
    let totalSignals = 0;
    let totalRaw = 0;
    const allSignals = [];

    for (let i = 0; i < filteredWeek.length; i += 10) {
      const batch = filteredWeek.slice(i, i + 10);
      const { signals, rawCount } = await extractHealthSignals(batch, provider);
      allSignals.push(...signals);
      totalSignals += signals.length;
      totalRaw += rawCount;
    }

    // Validate + aggregate
    const { days, stats } = aggregateByDay(allSignals, filteredWeek);

    console.log(
      `[health] extracted ${stats.extracted}, excluded ${stats.excluded}, validated ${stats.validated}`
    );

    if (days.length === 0) {
      console.log("[health] No active days");
      cachedHealth = null; cachedKey = key; cachedAt = now; cachedIsNull = true;
      return null;
    }

    console.log(`[health] ${days.length} active days`);

    // Coverage check: don't generate summary from incomplete data
    const coverage = totalRaw > 0 ? totalSignals / totalRaw : 0;
    let weekSummary = null;

    if (coverage >= COVERAGE_THRESHOLD) {
      // Count month-wide active days for context
      let monthActiveDays = days.length;
      const olderEntries = filteredMonth.filter(
        (e) => !filteredWeek.some((w) => w.id === e.id)
      );
      if (olderEntries.length > 0) {
        const { signals: olderSignals } = await extractHealthSignals(olderEntries.slice(0, 30), provider);
        const { days: olderDays } = aggregateByDay(olderSignals, olderEntries);
        monthActiveDays += olderDays.length;
      }

      weekSummary = await generateWeeklySummary(days, monthActiveDays, provider);
    } else {
      console.warn(`[health] Low coverage (${(coverage * 100).toFixed(0)}%) — skipping summary`);
    }

    const result: HealthMonitorOutput = { days, week_summary: weekSummary };
    cachedHealth = result; cachedKey = key; cachedAt = now; cachedIsNull = false;
    return result;
  } catch (err) {
    console.error("[health] Pipeline error:", err instanceof Error ? err.message : err);
    cachedHealth = null; cachedKey = key; cachedAt = now; cachedIsNull = true;
    return null;
  }
}
