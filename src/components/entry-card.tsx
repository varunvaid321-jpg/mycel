"use client";

import { useState } from "react";
import { CATEGORIES, type Category } from "@/lib/categories";
import { TOPICS, type Topic } from "@/lib/classifier";
import {
  TAG_STYLES,
  TAG_BASE,
  TAG_TOPIC,
  TEXT_META,
  TEXT_ENTRY_CONTENT,
  BTN_ICON_DELETE,
  BTN_DELETE_CONFIRM,
  BTN_DELETE_CANCEL,
  CARD,
  CARD_PADDING,
  CARD_HOVER,
} from "@/lib/design-tokens";

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
    <div className={`group ${CARD} ${CARD_PADDING} ${CARD_HOVER} animate-fade-in`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${TAG_BASE} ${TAG_STYLES[entry.category] || TAG_STYLES.spore}`}
          >
            {cat?.label || entry.category}
          </span>

          {topics.map((t) => (
            <span key={t} className={TAG_TOPIC}>
              {TOPICS[t]?.label || t}
            </span>
          ))}

          <span className={TEXT_META}>
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
              className={BTN_DELETE_CONFIRM}
            >
              delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className={BTN_DELETE_CANCEL}
            >
              keep
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className={BTN_ICON_DELETE}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className={TEXT_ENTRY_CONTENT}>
        <HighlightedText text={entry.content} term={searchTerm} />
      </div>
    </div>
  );
}
