// Health Monitor — Type definitions

export interface HealthSignal {
  entry_id: string;
  completed_activity: boolean;
  activity_text_exact: string;
  activity_type: ActivityType;
  confidence: "high" | "medium" | "low";
  needs_exclusion: boolean;
  exclusion_reason?: ExclusionReason;
}

export type ActivityType =
  | "strength"
  | "cardio"
  | "sport"
  | "walking"
  | "mobility"
  | "recovery"
  | "mixed"
  | "unknown";

export type ExclusionReason =
  | "intention_only"
  | "third_person_only"
  | "ambiguous"
  | "no_health_signal";

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
  tags: string;
}
