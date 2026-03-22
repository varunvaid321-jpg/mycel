"use client";

import { useEffect, useState } from "react";
import {
  CARD_SECTION,
  BORDER_NETWORK,
  TEXT_SECTION_HEADER,
  TEXT_SUBSECTION_HEADER,
  TEXT_BULLET,
  TEXT_META,
  TEXT_NOTE,
  TAG_THEME,
} from "@/lib/design-tokens";

interface AIBrief {
  patterns: string[];
  ripeDecisions: string[];
  conversationsToHave: string[];
  thingsToLetGo: string[];
  prioritizedActions: string[];
}

// Health types imported from health module — single source of truth
import type { HealthMonitorOutput, HealthDay } from "@/lib/health/types";
import { MAX_LABEL_LENGTH } from "@/lib/health/types";

interface WeeklyData {
  totalEntries: number;
  breakdown: Record<string, number>;
  themes: { word: string; count: number }[];
  reminders: string[];
  actions: string[];
  letting_go: string[];
  topCategory: { key: string; label: string; count: number } | null;
  aiBrief: AIBrief | null;
  // healthLog now fetched separately via /api/health
}

export default function WeeklySummary() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [healthData, setHealthData] = useState<HealthMonitorOutput | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch weekly summary (fast — no health, no Groq)
    fetch("/api/weekly")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch health separately (async, non-blocking — uses Groq)
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.healthLog) setHealthData(d.healthLog);
      })
      .catch(() => {}); // silent fail — health section stays hidden
  }, []);

  if (loading || !data || data.totalEntries === 0) return null;

  const ai = data.aiBrief;

  return (
    <div className={`${CARD_SECTION} ${BORDER_NETWORK}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 mb-4"
      >
        <span className="w-2 h-2 rounded-full bg-network animate-pulse-dot" />
        <span className={`${TEXT_SECTION_HEADER} text-network`}>
          The Network &middot; Weekly Brief
        </span>
        <span className={`ml-auto ${TEXT_META}`}>
          {data.totalEntries} entries
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-faint transition-transform ${collapsed ? "" : "rotate-180"}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {ai ? (
            <>
              {/* AI Patterns */}
              {ai.patterns.length > 0 && (
                <Section title="Patterns">
                  {ai.patterns.map((p, i) => (
                    <BulletItem key={i} icon="~" color="text-network" text={p} />
                  ))}
                </Section>
              )}

              {/* Ripe Decisions */}
              {ai.ripeDecisions.length > 0 && (
                <Section title="Decisions Ripening">
                  {ai.ripeDecisions.map((d, i) => (
                    <BulletItem key={i} icon="&#x25cf;" color="text-fruit" text={d} />
                  ))}
                </Section>
              )}

              {/* Conversations */}
              {ai.conversationsToHave.length > 0 && (
                <Section title="Conversations to Have">
                  {ai.conversationsToHave.map((c, i) => (
                    <BulletItem key={i} icon="&rarr;" color="text-signal" text={c} />
                  ))}
                </Section>
              )}

              {/* Let Go */}
              {ai.thingsToLetGo.length > 0 && (
                <Section title="Consider Letting Go">
                  {ai.thingsToLetGo.map((l, i) => (
                    <BulletItem key={i} icon="&times;" color="text-decompose" text={l} />
                  ))}
                </Section>
              )}

              {/* Actions */}
              {ai.prioritizedActions.length > 0 && (
                <Section title="This Week&apos;s Actions">
                  {ai.prioritizedActions.map((a, i) => (
                    <li key={i} className={`flex items-start gap-2 ${TEXT_BULLET}`}>
                      <span className="text-accent font-mono text-xs mt-0.5 shrink-0">
                        {i + 1}.
                      </span>
                      <span>{a}</span>
                    </li>
                  ))}
                </Section>
              )}

              {/* Health Log */}
              {healthData && <HealthMonitor healthLog={healthData} />}

              <p className={TEXT_NOTE}>
                ai-powered weekly brief
              </p>
            </>
          ) : (
            <>
              {/* Fallback: rule-based */}
              {data.themes.length > 0 && (
                <div>
                  <h3 className={TEXT_SUBSECTION_HEADER}>
                    Themes This Week
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.themes.map((t) => (
                      <span key={t.word} className={TAG_THEME}>
                        {t.word}
                        <span className="ml-1 text-text-faint">{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.reminders.length > 0 && (
                <Section title="Active Signals">
                  {data.reminders.map((r, i) => (
                    <BulletItem key={i} icon="&rarr;" color="text-signal" text={r} />
                  ))}
                </Section>
              )}

              {data.actions.length > 0 && (
                <Section title="Actions Taken">
                  {data.actions.map((a, i) => (
                    <BulletItem key={i} icon="&check;" color="text-fruit" text={a} />
                  ))}
                </Section>
              )}

              {data.letting_go.length > 0 && (
                <Section title="Decomposing">
                  {data.letting_go.map((l, i) => (
                    <BulletItem key={i} icon="~" color="text-decompose" text={l} />
                  ))}
                </Section>
              )}

              {/* Health Log (also shown in fallback mode) */}
              {healthData && <HealthMonitor healthLog={healthData} />}

              <p className={TEXT_NOTE}>
                weekly summary
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HealthMonitor({ healthLog }: { healthLog: HealthMonitorOutput }) {
  const activeDays = healthLog.days?.filter((d) => d.activities?.length > 0) || [];
  if (activeDays.length === 0) return null;

  function truncLabel(label: string): string {
    return label.length > MAX_LABEL_LENGTH ? label.slice(0, MAX_LABEL_LENGTH - 3) + "..." : label;
  }

  return (
    <div className="pt-3 border-t border-border">
      <h3 className={`${TEXT_SUBSECTION_HEADER} text-spore`}>Health Monitor</h3>
      <ul className="space-y-2">
        {activeDays.map((day, i) => (
          <li key={i} className={`flex items-start gap-3 ${TEXT_BULLET}`}>
            <span className="font-mono text-xs text-spore mt-0.5 shrink-0 w-24">{day.date}</span>
            <span className="text-text-muted">
              {day.activities.map((a) => truncLabel(a.label)).join(" · ")}
            </span>
          </li>
        ))}
      </ul>
      {healthLog.week_summary && (
        <div className="mt-3 space-y-1">
          {healthLog.week_summary.pattern_note && (
            <p className="text-sm text-text-muted">{healthLog.week_summary.pattern_note}</p>
          )}
          {healthLog.week_summary.next_best_action && (
            <p className="text-sm text-text-muted">{healthLog.week_summary.next_best_action}</p>
          )}
          {healthLog.week_summary.motivation && (
            <p className="text-sm text-spore/90 italic">{healthLog.week_summary.motivation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={TEXT_SUBSECTION_HEADER}>
        {title}
      </h3>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function BulletItem({ icon, color, text }: { icon: string; color: string; text: string }) {
  const [expanded, setExpanded] = useState(false);

  // Get first complete sentence
  const sentenceEnd = text.search(/[.!?]\s|[.!?]$/);
  const firstSentence = sentenceEnd > 0 ? text.slice(0, sentenceEnd + 1) : text;
  const hasMore = firstSentence.length < text.length;

  return (
    <li className={`flex items-start gap-2 ${TEXT_BULLET}`}>
      <span
        className={`${color} font-mono text-xs mt-0.5 shrink-0`}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      <span>
        <BoldText text={expanded || !hasMore ? text : firstSentence} />
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 font-mono text-sm text-text-faint hover:text-accent transition-colors"
          >
            {expanded ? "less" : "more"}
          </button>
        )}
      </span>
    </li>
  );
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-text-primary">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
