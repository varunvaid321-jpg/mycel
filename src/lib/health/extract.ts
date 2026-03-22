// Health Monitor — Health Signal Extraction
// Sends entry batches to LLM, returns structured health signals

import type { LLMProvider } from "./provider";
import type { HealthSignal, JournalEntry } from "./types";

const EXTRACTION_SYSTEM_PROMPT = `You analyze journal entries for physical activity. Return a JSON array.

For EACH entry, determine if the person ACTUALLY DID physical activity (not planned, not someone else's).

STRICT RULES:
- Only count activities the person COMPLETED. "Need to", "want to", "should", "planning to" = NOT completed.
- Only count the PERSON'S OWN activity. "Kyna at dance", "kids swimming" = NOT the person's activity UNLESS they say "we" or "I" did it too.
- Use ONLY words from the entry. Never add exercise details (body parts, duration, reps) not explicitly written.
- If uncertain, set confidence to "medium" or exclude entirely.
- "Good gym day" = completed, type "unknown" (do NOT infer what they did at the gym).

Return JSON array (one object per entry):
[{
  "entry_id": "the id provided",
  "completed_activity": true/false,
  "activity_text_exact": "short quote from their words, max 10 words",
  "activity_type": "strength|cardio|sport|walking|mobility|recovery|mixed|unknown",
  "confidence": "high|medium|low",
  "needs_exclusion": true/false,
  "exclusion_reason": "intention_only|third_person_only|ambiguous|no_health_signal"
}]

If an entry has NO health signal at all, set completed_activity=false, needs_exclusion=true, exclusion_reason="no_health_signal".
If an entry has BOTH intention AND completion, keep only the completed part.`;

// Extract health signals from a batch of entries
export async function extractHealthSignals(
  entries: JournalEntry[],
  provider: LLMProvider
): Promise<HealthSignal[]> {
  if (entries.length === 0) return [];

  // Format entries for the prompt
  const formatted = entries
    .map((e) => `[ID: ${e.id}] [${e.localDate}] ${e.content}`)
    .join("\n\n");

  const result = await provider.ask(
    EXTRACTION_SYSTEM_PROMPT,
    `Analyze these journal entries:\n\n${formatted}`,
    1500
  );

  if (!result) {
    console.error("[health:extract] LLM returned null");
    return [];
  }

  // Parse JSON from response
  const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("[health:extract] No JSON array in response");
    return [];
  }

  try {
    const signals = JSON.parse(jsonMatch[0]) as HealthSignal[];
    if (!Array.isArray(signals)) return [];
    return signals;
  } catch {
    console.error("[health:extract] JSON parse failed");
    return [];
  }
}
