"use client";

import { useEffect, useState } from "react";
import {
  CARD,
  BORDER_FRUIT,
  TEXT_SECTION_HEADER,
  TEXT_META,
  TEXT_EMPTY,
  TEXT_LABEL,
  TEXT_ENTRY_CONTENT,
  TAG_BASE,
  TAG_STYLES,
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
            <span className={`${TAG_BASE} ${TAG_STYLES.fruit}`}>
              fruit
            </span>
            <span className={TEXT_META}>
              {d.localDate} &middot; {d.localTime}
            </span>
          </div>
          <p className={`${TEXT_ENTRY_CONTENT} mb-3`}>{d.content}</p>

          {d.linkedEntries.length > 0 && (
            <div className="space-y-1.5 pl-3 border-l border-border">
              <span className={TEXT_LABEL}>
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
                  <span className={TEXT_META}>
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
