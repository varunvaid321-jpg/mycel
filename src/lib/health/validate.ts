// Health Monitor — Phrase-level grounding + semantic validation

import type { HealthSignal } from "./types";
import { INTENTION_VERBS, THIRD_PERSON_INDICATORS } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

// Check if label is a near-contiguous substring of source
// Allows up to 2 extra words inserted between label words
function isPhraseGrounded(label: string, source: string): boolean {
  const normLabel = normalize(label);
  const normSource = normalize(source);

  // Direct substring match (best case)
  if (normSource.includes(normLabel)) return true;

  // Fuzzy: allow small gaps (1-2 words) between label words
  const labelWords = normLabel.split(" ").filter((w) => w.length > 1);
  if (labelWords.length === 0) return false;

  // Build a regex that allows 0-2 words between each label word
  const pattern = labelWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+(?:\\S+\\s+){0,2}");
  try {
    return new RegExp(pattern).test(normSource);
  } catch {
    return false;
  }
}

// Check if label contains intention/learning verbs
function hasIntentionVerbs(label: string): boolean {
  const words = normalize(label).split(" ");
  return words.some((w) => INTENTION_VERBS.has(w));
}

// Check if the SOURCE entry is primarily about someone else's activity
function isThirdPersonEntry(sourceContent: string): boolean {
  const norm = normalize(sourceContent);

  // Quick check: does the entry contain a third-person indicator AND an activity word?
  const hasThirdPerson = Array.from(THIRD_PERSON_INDICATORS).some((w) => norm.includes(w));
  if (!hasThirdPerson) return false;

  const hasActivity = /\b(dance|swim|swimming|soccer|volleyball|walk|walking|exercise|sport|active|gym|yoga|run|running)\b/.test(norm);
  if (!hasActivity) return false;

  // If the entry has first-person AND third-person + activity, check if it's about "we"
  const hasFirstPerson = /\b(i |me |my |we |ive |im )\b/.test(norm + " ");
  if (hasFirstPerson) {
    // "We played" = include (first person participates)
    // "I asked her to walk" = exclude (first person is NOT doing the activity)
    if (/\b(ask(ed|ing)?|told|tell(ing)?|want(ed|s)?|ensure|make sure)\b/.test(norm)) return true;
    if (/\b(select|pick|buy|choose)\b/.test(norm)) return true;
    return false; // "we played" case
  }

  // Third-person + activity + no first-person = exclude
  return true;
}

export function validateSignal(
  signal: HealthSignal,
  sourceContent: string
): { valid: boolean; reason?: string } {
  // Always discard excluded signals
  if (signal.needs_exclusion) {
    return { valid: false, reason: signal.exclusion_reason || "excluded" };
  }

  // Discard non-completed
  if (!signal.completed_activity) {
    return { valid: false, reason: "not_completed" };
  }

  // Discard low confidence
  if (signal.confidence === "low") {
    return { valid: false, reason: "low_confidence" };
  }

  // Reject empty labels
  const label = signal.activity_text_exact.trim();
  if (label.length === 0) {
    return { valid: false, reason: "empty_label" };
  }

  // Reject labels with intention/learning verbs
  if (hasIntentionVerbs(label)) {
    return { valid: false, reason: "intention_verb_in_label" };
  }

  // Reject if source entry is about someone else's activity
  if (isThirdPersonEntry(sourceContent)) {
    return { valid: false, reason: "third_person_entry" };
  }

  // Phrase-level grounding: label must be a near-contiguous phrase from source
  if (!isPhraseGrounded(label, sourceContent)) {
    console.warn(`[health:validate] REJECTED "${label}" — not grounded in source`);
    return { valid: false, reason: "not_phrase_grounded" };
  }

  // Medium confidence + short label = suspicious, drop it
  if (signal.confidence === "medium" && label.split(/\s+/).length <= 2) {
    return { valid: false, reason: "low_confidence_short_label" };
  }

  return { valid: true };
}
