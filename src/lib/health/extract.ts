// Health Monitor — Structured extraction with runtime validation

import type { LLMProvider } from "./provider";
import type { HealthSignal, JournalEntry } from "./types";
import { isValidHealthSignal, MAX_LABEL_LENGTH } from "./types";

const EXTRACTION_PROMPT = `You analyze journal entries for COMPLETED PHYSICAL ACTIVITY only. Return a JSON array.

Physical activity means: exercise, sports, gym, walking, running, swimming, yoga, stretching, push-ups, weights, cycling, etc.
NOT physical activity — EXCLUDE: eating, cooking, diet, food, recipes, supplements, vitamins, ginger, oats, sleep, rest, meditation thoughts, emotional states, work meetings.

COMPLETED means past tense: "did", "completed", "went", "played", "walked", "ran", "swam".
NOT completed — EXCLUDE these: "want to", "need to", "should", "planning to", "learn", "going to", "hope to", "thinking about", "might", "tomorrow", "try to", "explore", "research".

RULES:
1. Only the person's OWN activity. "Kyna at dance", "kids swimming", "asked her to walk" = exclude.
2. activity_text_exact MUST be a phrase that appears in their entry almost word-for-word. Never rephrase. "played table tennis" not "played table". "completed 10 push-ups" not "completed 10".
3. NEVER add details not in the text. "gym" → type "unknown", NOT "strength".
4. If both intention AND completion in one entry, extract ONLY the completed part.
5. entry_id must be EXACTLY the ID provided. Never invent IDs.
6. Return EXACTLY one object per entry.
7. If uncertain → needs_exclusion=true, exclusion_reason="ambiguous".

Return JSON array:
[{
  "entry_id": "exact ID from input",
  "completed_activity": true/false,
  "activity_text_exact": "exact phrase from their entry",
  "activity_type": "strength|cardio|sport|walking|mobility|recovery|mixed|unknown",
  "confidence": "high|medium|low",
  "needs_exclusion": true/false,
  "exclusion_reason": "intention_only|third_person_only|ambiguous|no_health_signal"
}]`;

export async function extractHealthSignals(
  entries: JournalEntry[],
  provider: LLMProvider
): Promise<{ signals: HealthSignal[]; rawCount: number }> {
  if (entries.length === 0) return { signals: [], rawCount: 0 };

  // Collect valid entry IDs for validation
  const validIds = new Set(entries.map((e) => e.id));

  const formatted = entries
    .map((e) => `[ID: ${e.id}] [${e.localDate}] ${e.content}`)
    .join("\n\n");

  const result = await provider.ask(
    EXTRACTION_PROMPT,
    `Analyze these journal entries:\n\n${formatted}`,
    1500
  );

  if (!result) {
    console.error("[health:extract] LLM returned null");
    return { signals: [], rawCount: 0 };
  }

  // Parse JSON array from response
  const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("[health:extract] No JSON array found in response");
    return { signals: [], rawCount: 0 };
  }

  let rawItems: unknown[];
  try {
    rawItems = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(rawItems)) {
      console.error("[health:extract] Parsed result is not an array");
      return { signals: [], rawCount: 0 };
    }
  } catch {
    console.error("[health:extract] JSON parse failed");
    return { signals: [], rawCount: 0 };
  }

  // Runtime validate each signal
  const signals: HealthSignal[] = [];
  let rejected = 0;

  for (const item of rawItems) {
    if (!isValidHealthSignal(item)) {
      rejected++;
      continue;
    }

    // Reject invented entry_ids
    if (!validIds.has(item.entry_id)) {
      console.warn(`[health:extract] REJECTED invented entry_id: ${item.entry_id}`);
      rejected++;
      continue;
    }

    // Truncate label (validation happens later, this is safety)
    if (item.activity_text_exact.length > MAX_LABEL_LENGTH * 2) {
      item.activity_text_exact = item.activity_text_exact.slice(0, MAX_LABEL_LENGTH);
    }

    signals.push(item);
  }

  if (rejected > 0) {
    console.warn(`[health:extract] ${rejected} signals failed schema validation`);
  }

  return { signals, rawCount: rawItems.length };
}
