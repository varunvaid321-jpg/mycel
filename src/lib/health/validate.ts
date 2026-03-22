// Health Monitor — Hallucination Guard
// Validates that extracted activity text is grounded in the source entry

import type { HealthSignal } from "./types";

// Check that extracted label words exist in the source text
export function validateSignal(
  signal: HealthSignal,
  sourceContent: string
): { valid: boolean; reason?: string } {
  // Always discard excluded signals
  if (signal.needs_exclusion) {
    return { valid: false, reason: signal.exclusion_reason || "excluded" };
  }

  // Discard non-completed activities
  if (!signal.completed_activity) {
    return { valid: false, reason: "not_completed" };
  }

  // Discard low confidence
  if (signal.confidence === "low") {
    return { valid: false, reason: "low_confidence" };
  }

  // Validate grounding: every significant word in the label must exist in source
  const sourceWords = new Set(
    sourceContent.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ""))
  );

  const labelWords = signal.activity_text_exact
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (labelWords.length === 0) {
    return { valid: false, reason: "empty_label" };
  }

  const fabricated = labelWords.filter((w) => !sourceWords.has(w));
  const fabricatedRatio = fabricated.length / labelWords.length;

  if (fabricatedRatio > 0.3) {
    console.warn(
      `[health:validate] REJECTED "${signal.activity_text_exact}" — fabricated: ${fabricated.join(", ")}`
    );
    return { valid: false, reason: `fabricated_words: ${fabricated.join(", ")}` };
  }

  return { valid: true };
}
