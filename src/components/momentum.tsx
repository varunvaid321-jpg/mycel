"use client";

import { useEffect, useState } from "react";

interface MomentumData {
  days: { date: string; topics: Record<string, number> }[];
  topics: { key: string; label: string }[];
}

export default function Momentum() {
  const [data, setData] = useState<MomentumData | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    fetch("/api/momentum")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  // Filter to only topics that have at least 1 entry
  const activeTopics = data.topics.filter((t) =>
    data.days.some((d) => d.topics[t.key] > 0)
  );

  if (activeTopics.length === 0) return null;

  function cellColor(count: number): string {
    if (count === 0) return "bg-border/30";
    if (count === 1) return "bg-accent/30";
    return "bg-accent/70";
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5 md:p-6 mb-8 animate-fade-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2"
      >
        <span className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-accent/80">
          Momentum &middot; 30 Days
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`ml-auto text-text-faint transition-transform ${collapsed ? "" : "rotate-180"}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {!collapsed && (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Day labels */}
            <div className="flex items-center mb-1 ml-20">
              {data.days.map((d, i) => (
                <div
                  key={d.date}
                  className="flex-1 text-center font-mono text-[0.45rem] text-text-faint"
                >
                  {i % 7 === 0 ? d.date.slice(5) : ""}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {activeTopics.map((topic) => (
              <div key={topic.key} className="flex items-center mb-0.5">
                <span className="w-20 text-right pr-3 font-mono text-[0.55rem] text-text-muted truncate shrink-0">
                  {topic.label}
                </span>
                <div className="flex flex-1 gap-px">
                  {data.days.map((day) => (
                    <div
                      key={day.date}
                      className={`flex-1 h-3 rounded-sm ${cellColor(day.topics[topic.key] || 0)}`}
                      title={`${topic.label}: ${day.topics[topic.key] || 0} entries on ${day.date}`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-20">
              <span className="font-mono text-[0.5rem] text-text-faint">less</span>
              <div className="w-3 h-3 rounded-sm bg-border/30" />
              <div className="w-3 h-3 rounded-sm bg-accent/30" />
              <div className="w-3 h-3 rounded-sm bg-accent/70" />
              <span className="font-mono text-[0.5rem] text-text-faint">more</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
