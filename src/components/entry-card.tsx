"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { TOPICS, type Topic } from "@/lib/classifier";

interface Entry {
  id: string;
  content: string;
  category: string;
  tags: string;
  localDate: string;
  localTime: string;
  createdAt: string;
}

interface EntryCardProps {
  entry: Entry;
  onDelete: (id: string) => void;
  searchTerm?: string;
}

const tagStyles: Record<string, string> = {
  spore: "bg-spore/15 text-spore",
  root: "bg-root/15 text-root",
  signal: "bg-signal/15 text-signal",
  decompose: "bg-decompose/20 text-decompose",
  fruit: "bg-fruit/15 text-fruit",
};

function HighlightedText({ text, term }: { text: string; term?: string }) {
  if (!term) return <>{text}</>;

  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-accent/30 text-text-primary rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function EntryCard({ entry, onDelete, searchTerm }: EntryCardProps) {
  const [confirming, setConfirming] = useState(false);
  const cat = CATEGORIES[entry.category as Category];
  const topics = entry.tags
    ? entry.tags.split(",").filter(Boolean) as Topic[]
    : [];

  return (
    <div className="group bg-surface border border-border rounded-lg p-4 sm:p-5 transition-colors hover:border-border/80 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-mono text-[0.6rem] tracking-[0.12em] uppercase px-2 py-0.5 rounded
              ${tagStyles[entry.category] || tagStyles.spore}`}
          >
            {cat?.label || entry.category}
          </span>

          {topics.map((t) => (
            <span
              key={t}
              className="font-mono text-[0.55rem] tracking-wider px-1.5 py-0.5 rounded
                bg-accent/10 text-accent/70"
            >
              {TOPICS[t]?.label || t}
            </span>
          ))}

          <span className="font-mono text-[0.65rem] text-text-faint tracking-wide">
            {entry.localDate} &middot; {entry.localTime}
          </span>
        </div>

        {confirming ? (
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => {
                onDelete(entry.id);
                setConfirming(false);
              }}
              className="px-3 py-2 min-h-[44px] rounded bg-signal/20 border border-signal/40 text-signal
                font-mono text-[0.65rem] tracking-wider transition-all hover:bg-signal/30 flex items-center"
            >
              delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-3 py-2 min-h-[44px] rounded border border-border text-text-faint
                font-mono text-[0.65rem] tracking-wider transition-all hover:text-text-muted flex items-center"
            >
              keep
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 ml-2
              border border-border text-text-faint hover:border-signal/40 hover:text-signal
              transition-all"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="text-[1.05rem] leading-[1.75] whitespace-pre-wrap">
        <HighlightedText text={entry.content} term={searchTerm} />
      </div>
    </div>
  );
}
