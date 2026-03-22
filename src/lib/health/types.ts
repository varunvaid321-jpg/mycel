// Health Monitor — Type definitions, runtime validators, constants

// ── Constants ──
export const MAX_LABEL_LENGTH = 80;
export const MAX_SUMMARY_LENGTH = 120;
export const PIPELINE_VERSION = "v2.1";
export const MAX_ACTIVITIES_PER_DAY = 5;
export const COVERAGE_THRESHOLD = 0.7; // 70% extraction coverage required for summary

export const INTENTION_VERBS = new Set([
  "need", "needs", "should", "plan", "planning", "try", "trying",
  "want", "wants", "hope", "hoping", "going", "might", "must",
  "learn", "learning", "explore", "exploring", "research", "researching",
  "thinking", "tomorrow", "someday", "maybe",
  "motivated", "motivation", "unable", "cant",
]);

export const THIRD_PERSON_INDICATORS = new Set([
  "kyna", "krish", "puja", "daughter", "son", "wife", "kids",
  "she", "her", "he", "his", "them", "they",
]);

export const VALID_ACTIVITY_TYPES = new Set([
  "strength", "cardio", "sport", "walking", "mobility", "recovery", "mixed", "unknown",
]);

export const VALID_CONFIDENCES = new Set(["high", "medium", "low"]);

export const VALID_EXCLUSION_REASONS = new Set([
  "intention_only", "third_person_only", "ambiguous", "no_health_signal",
]);

// ── Types ──
export type ActivityType =
  | "strength" | "cardio" | "sport" | "walking"
  | "mobility" | "recovery" | "mixed" | "unknown";

export type ExclusionReason =
  | "intention_only" | "third_person_only" | "ambiguous" | "no_health_signal";

export interface HealthSignal {
  entry_id: string;
  completed_activity: boolean;
  activity_text_exact: string;
  activity_type: ActivityType;
  confidence: "high" | "medium" | "low";
  needs_exclusion: boolean;
  exclusion_reason?: ExclusionReason;
}

export interface HealthActivity {
  label: string;
  type: ActivityType;
  confidence: "high" | "medium";
  source_entry_id: string;
}

export interface HealthDay {
  date: string;
  activities: HealthActivity[];
}

export interface WeekSummary {
  active_days: number;
  pattern_note: string;
  next_best_action: string;
  motivation: string;
}

export interface HealthMonitorOutput {
  days: HealthDay[];
  week_summary: WeekSummary | null;
}

export interface JournalEntry {
  id: string;
  content: string;
  localDate: string;
  localTime: string;
  createdAt: Date;
  updatedAt?: Date;
  tags: string;
}

// ── Runtime Validators ──

export function isValidHealthSignal(obj: unknown): obj is HealthSignal {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  if (typeof s.entry_id !== "string" || s.entry_id.length === 0) return false;
  if (typeof s.completed_activity !== "boolean") return false;
  if (typeof s.activity_text_exact !== "string") return false;
  if (!VALID_ACTIVITY_TYPES.has(s.activity_type as string)) return false;
  if (!VALID_CONFIDENCES.has(s.confidence as string)) return false;
  if (typeof s.needs_exclusion !== "boolean") return false;
  if (s.needs_exclusion && s.exclusion_reason && !VALID_EXCLUSION_REASONS.has(s.exclusion_reason as string)) return false;
  return true;
}

export function isValidWeekSummary(obj: unknown): obj is WeekSummary {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  if (typeof s.active_days !== "number") return false;
  if (typeof s.pattern_note !== "string" || s.pattern_note.length === 0) return false;
  if (typeof s.motivation !== "string" || s.motivation.length === 0) return false;
  return true;
}

// ── Tag Filtering Helper ──

export function hasTag(tags: string, tag: string): boolean {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .includes(tag.toLowerCase());
}

export function isImportedEntry(entry: JournalEntry): boolean {
  return hasTag(entry.tags, "imported") || hasTag(entry.tags, "chatgpt");
}
