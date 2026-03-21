"use client";

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
  onArchive: (id: string) => void;
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

export default function EntryCard({ entry, onArchive, searchTerm }: EntryCardProps) {
  const cat = CATEGORIES[entry.category as Category];
  const topics = entry.tags
    ? entry.tags.split(",").filter(Boolean) as Topic[]
    : [];

  return (
    <div className="group bg-surface border border-border rounded-lg p-5 transition-colors hover:border-border/80 animate-fade-in">
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

        <button
          onClick={() => onArchive(entry.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[0.6rem]
            text-text-faint hover:text-signal tracking-wider shrink-0 ml-2"
          title="Archive"
        >
          &times;
        </button>
      </div>

      <div className="text-[1.05rem] leading-[1.75] whitespace-pre-wrap">
        <HighlightedText text={entry.content} term={searchTerm} />
      </div>
    </div>
  );
}
