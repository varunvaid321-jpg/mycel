// Health Monitor — Summary from validated structured data only

import type { LLMProvider } from "./provider";
import type { HealthDay, WeekSummary } from "./types";
import { isValidWeekSummary, MAX_SUMMARY_LENGTH } from "./types";

const SUMMARY_PROMPT = `Generate a weekly health summary from validated activity data ONLY. Never reference information not listed below.

RULES:
- pattern_note: max 10 words. What types appeared. "walking" = cardio.
- next_best_action: max 10 words. One suggestion if imbalanced. If good mix: "Keep it up."
- motivation: max 8 words. Direct.
- Use "you". No medical claims. No intensity inference. No recovery inference.

Return JSON:
{"active_days": N, "pattern_note": "...", "next_best_action": "...", "motivation": "..."}`;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

export async function generateWeeklySummary(
  thisWeekDays: HealthDay[],
  monthActivityDayCount: number,
  provider: LLMProvider
): Promise<WeekSummary | null> {
  if (thisWeekDays.length === 0) return null;

  const weekData = thisWeekDays.map((d) => ({
    date: d.date,
    activities: d.activities.map((a) => `${a.label} (${a.type})`),
  }));

  const prompt = `This week's validated activities:\n${JSON.stringify(weekData, null, 2)}\n\nLast 30 days total active days: ${monthActivityDayCount}`;

  const result = await provider.ask(SUMMARY_PROMPT, prompt, 300);
  if (!result) return null;

  const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[health:summarize] No JSON object in response");
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    console.error("[health:summarize] JSON parse failed");
    return null;
  }

  if (!isValidWeekSummary(parsed)) {
    console.error("[health:summarize] Invalid summary shape");
    return null;
  }

  // Override active_days with actual count
  parsed.active_days = thisWeekDays.length;

  // Truncate fields
  parsed.pattern_note = truncate(parsed.pattern_note, MAX_SUMMARY_LENGTH);
  parsed.next_best_action = truncate(parsed.next_best_action || "", MAX_SUMMARY_LENGTH);
  parsed.motivation = truncate(parsed.motivation, MAX_SUMMARY_LENGTH);

  return parsed;
}
