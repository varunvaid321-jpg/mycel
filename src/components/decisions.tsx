"use client";

import { useEffect, useState } from "react";
import {
  CARD,
  BORDER_FRUIT,
  TEXT_SECTION_HEADER,
  TEXT_META,
  TEXT_EMPTY,
} from "@/lib/design-tokens";

interface LinkedEntry {
  id: string;
  content: string;
  category: string;
  localDate: string;
  localTime: string;
}

interface Decision {
  id: string;
  content: string;
  localDate: string;
  localTime: string;
  createdAt: string;
  linkedEntries: LinkedEntry[];
}

interface DecisionsProps {
  visible: boolean;
}

const catColors: Record<string, string> = {
  spore: "border-spore/40",
  signal: "border-signal/40",
  root: "border-root/40",
};

export default function Decisions({ visible }: DecisionsProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    fetch("/api/decisions")
      .then((r) => r.json())
      .then((data) => {
        setDecisions(data.decisions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [visible]);

  if (!visible) return null;

  if (loading) {
    return (
      <div className="text-center py-8">
        <span className={TEXT_EMPTY}>loading decisions...</span>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className={TEXT_EMPTY}>
          no decisions yet &mdash; fruit entries will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <h2 className={`${TEXT_SECTION_HEADER} text-fruit/80`}>
        Decision Trail
      </h2>
      {decisions.map((d) => (
        <div
          key={d.id}
          className={`${CARD} ${BORDER_FRUIT} p-4 animate-fade-in`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm tracking-wider uppercase text-fruit/70 px-1.5 py-0.5 bg-fruit/10 rounded">
              fruit
            </span>
            <span className={TEXT_META}>
              {d.localDate} &middot; {d.localTime}
            </span>
          </div>
          <p className="text-[1.05rem] leading-relaxed mb-3">{d.content}</p>

          {d.linkedEntries.length > 0 && (
            <div className="space-y-1.5 pl-3 border-l border-border">
              <span className="font-mono text-xs tracking-wider uppercase text-text-faint">
                thoughts that led here
              </span>
              {d.linkedEntries.map((le) => (
                <div
                  key={le.id}
                  className={`pl-3 border-l-2 ${catColors[le.category] || "border-border"}`}
                >
                  <p className="text-sm text-text-muted leading-relaxed">
                    {le.content.slice(0, 150)}
                    {le.content.length > 150 ? "..." : ""}
                  </p>
                  <span className="font-mono text-xs text-text-faint">
                    {le.localDate} &middot; {le.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
