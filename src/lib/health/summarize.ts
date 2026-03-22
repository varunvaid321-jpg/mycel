// Health Monitor — Weekly Summary Generation
// Uses validated activity data + 30-day context for pattern-based suggestions

import type { LLMProvider } from "./provider";
import type { HealthDay, WeekSummary } from "./types";

const SUMMARY_SYSTEM_PROMPT = `You generate a short weekly health summary from validated activity data.

You receive:
1. This week's confirmed activities (already validated, no hallucination possible)
2. Last month's activity count for context

IMPORTANT: "walking" IS cardio. Do not suggest adding cardio if walking is already present.

RULES:
- "active_days": count of days with at least one activity this week
- "pattern_note": one SHORT sentence about what they did. Max 10 words. Example: "Mix of weights, walking, and sport."
- "next_best_action": one SHORT suggestion ONLY if something is clearly missing. Max 10 words. If they have a good mix, just say "Keep it up." Do NOT write long advice.
- "motivation": one short sentence. Max 8 words. Direct, not cheesy.
- Speak using "you".
- Never diagnose or make medical claims.
- Keep the ENTIRE response minimal. Less is more.

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
