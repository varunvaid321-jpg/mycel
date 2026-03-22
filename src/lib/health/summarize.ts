// Health Monitor — Weekly Summary Generation
// Uses validated activity data + 30-day context for pattern-based suggestions

import type { LLMProvider } from "./provider";
import type { HealthDay, WeekSummary } from "./types";

const SUMMARY_SYSTEM_PROMPT = `You generate a short weekly health summary from validated activity data.

You receive:
1. This week's confirmed activities (already validated, no hallucination possible)
2. Last month's activity count for context

RULES:
- "active_days": count of days with at least one activity this week
- "pattern_note": one sentence about what types of activity they did (strength, cardio, sport, walking). Use ONLY what's in the data. Never invent.
- "next_best_action": one practical suggestion based on what's missing. If they did only strength, suggest cardio or sport. If good mix, say so. Keep it low-ego and practical.
- "motivation": one short encouraging sentence. Not cheesy. Direct.
- Speak using "you" — directly to the person.
- Never diagnose or make medical claims.

Return JSON:
{"active_days": N, "pattern_note": "...", "next_best_action": "...", "motivation": "..."}`;

export async function generateWeeklySummary(
  thisWeekDays: HealthDay[],
  monthActivityDayCount: number,
  provider: LLMProvider
): Promise<WeekSummary | null> {
  if (thisWeekDays.length === 0) return null;

  // Build a compact summary of this week's activities for the LLM
  const weekData = thisWeekDays.map((d) => ({
    date: d.date,
    activities: d.activities.map((a) => `${a.label} (${a.type})`),
  }));

  const prompt = `This week's validated activities:\n${JSON.stringify(weekData, null, 2)}\n\nLast 30 days total active days: ${monthActivityDayCount}`;

  const result = await provider.ask(SUMMARY_SYSTEM_PROMPT, prompt, 300);
  if (!result) return null;

  // Parse JSON
  const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const summary = JSON.parse(jsonMatch[0]) as WeekSummary;
    if (!summary.pattern_note || !summary.motivation) return null;
    summary.active_days = thisWeekDays.length; // Override with actual count
    return summary;
  } catch {
    return null;
  }
}
