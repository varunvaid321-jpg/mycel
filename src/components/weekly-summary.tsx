"use client";

import { useEffect, useState } from "react";

interface WeeklyData {
  totalEntries: number;
  breakdown: Record<string, number>;
  themes: { word: string; count: number }[];
  reminders: string[];
  actions: string[];
  letting_go: string[];
  topCategory: { key: string; label: string; count: number } | null;
}

export default function WeeklySummary() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/weekly")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data || data.totalEntries === 0) return null;

  return (
    <div className="bg-surface border border-border border-l-[3px] border-l-network rounded-lg p-5 md:p-6 mb-8 animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 mb-4"
      >
        <span className="w-2 h-2 rounded-full bg-network animate-pulse-dot" />
        <span className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-network">
          The Network &middot; Weekly Brief
        </span>
        <span className="ml-auto font-mono text-[0.6rem] text-text-faint">
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
          {/* Themes */}
          {data.themes.length > 0 && (
            <div>
              <h3 className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-muted mb-2">
                Themes This Week
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.themes.map((t) => (
                  <span
                    key={t.word}
                    className="px-2 py-0.5 bg-network/10 text-network/80 rounded font-mono text-[0.65rem]"
                  >
                    {t.word}
                    <span className="ml-1 text-text-faint">{t.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reminders */}
          {data.reminders.length > 0 && (
            <div>
              <h3 className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-muted mb-2">
                Active Signals
              </h3>
              <ul className="space-y-1">
                {data.reminders.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="text-signal font-mono text-xs mt-0.5 shrink-0">&rarr;</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {data.actions.length > 0 && (
            <div>
              <h3 className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-muted mb-2">
                Actions Taken
              </h3>
              <ul className="space-y-1">
                {data.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="text-fruit font-mono text-xs mt-0.5 shrink-0">&check;</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Letting go */}
          {data.letting_go.length > 0 && (
            <div>
              <h3 className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-muted mb-2">
                Decomposing
              </h3>
              <ul className="space-y-1">
                {data.letting_go.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-text-muted">
                    <span className="text-decompose font-mono text-xs mt-0.5 shrink-0">~</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="font-mono text-[0.55rem] text-text-faint tracking-wider pt-2 border-t border-border">
            v1 rule-based summary &middot; AI summarizer slot ready for v2
          </p>
        </div>
      )}
    </div>
  );
}
