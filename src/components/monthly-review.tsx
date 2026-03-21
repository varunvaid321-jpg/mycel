"use client";

import { useEffect, useState } from "react";

interface AIReview {
  topFocusAreas: { topic: string; count: number }[];
  keyDecisions: string[];
  circlingThemes: string[];
  shiftedTopics: string[];
  reflection: string;
}

interface MonthlyData {
  totalEntries: number;
  topFocusAreas: { topic: string; count: number }[];
  keyDecisions: string[];
  categoryBreakdown: Record<string, number>;
  aiReview: AIReview | null;
}

export default function MonthlyReview() {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    fetch("/api/monthly")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.totalEntries === 0) return null;

  const ai = data.aiReview;

  return (
    <div className="bg-surface border border-border border-l-[3px] border-l-network/60 rounded-lg p-5 md:p-6 mb-8 animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-network/60" />
        <span className="font-mono text-sm tracking-[0.2em] uppercase text-network/80">
          Monthly Review
        </span>
        <span className="ml-auto font-mono text-sm text-text-faint">
          {data.totalEntries} entries &middot; 30d
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
        <div className="space-y-4 mt-4">
          {ai ? (
            <>
              {ai.topFocusAreas.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2">
                    Where Your Attention Went
                  </h3>
                  <div className="space-y-1">
                    {ai.topFocusAreas.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-sm text-accent w-6 text-right">
                          {a.count}
                        </span>
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent/60 rounded-full"
                            style={{
                              width: `${Math.min(100, (a.count / (ai.topFocusAreas[0]?.count || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-sm text-text-muted w-20">
                          {a.topic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ai.keyDecisions.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2">
                    Key Decisions
                  </h3>
                  <ul className="space-y-1">
                    {ai.keyDecisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                        <span className="text-fruit font-mono text-xs mt-0.5 shrink-0">&#x25cf;</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.circlingThemes.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2">
                    Still Circling
                  </h3>
                  <ul className="space-y-1">
                    {ai.circlingThemes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-text-muted">
                        <span className="text-signal font-mono text-xs mt-0.5 shrink-0">&#x21bb;</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.shiftedTopics.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2">
                    What Shifted
                  </h3>
                  <ul className="space-y-1">
                    {ai.shiftedTopics.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-text-muted">
                        <span className="text-decompose font-mono text-xs mt-0.5 shrink-0">&darr;</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.reflection && (
                <div className="pt-3 border-t border-border">
                  <p className="text-sm leading-relaxed italic text-text-muted font-serif">
                    {ai.reflection}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Fallback stats */}
              {data.topFocusAreas.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2">
                    Top Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.topFocusAreas.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-network/10 text-network/80 rounded font-mono text-sm"
                      >
                        {a.topic}
                        <span className="ml-1 text-text-faint">{a.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.keyDecisions.length > 0 && (
                <div>
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-text-muted mb-2">
                    Decisions Made
                  </h3>
                  <ul className="space-y-1">
                    {data.keyDecisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                        <span className="text-fruit font-mono text-xs mt-0.5 shrink-0">&#x2713;</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="font-mono text-xs text-text-faint tracking-wider pt-2 border-t border-border">
                basic stats &middot; add ANTHROPIC_API_KEY for ai review
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
