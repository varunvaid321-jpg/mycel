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
import Lightbox from "./lightbox";

interface Entry {
  id: string;
  content: string;
  category: string;
  tags: string;
  localDate: string;
  localTime: string;
  createdAt: string;
  imagePath?: string;
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const cat = CATEGORIES[entry.category as Category];
  const topics = entry.tags
    ? entry.tags.split(",").filter(Boolean) as Topic[]
    : [];

  const imageSrcs = entry.imagePath
    ? entry.imagePath.split(",").filter(Boolean).map((p) => `/api/images/${p.split(".")[0]}`)
    : [];

  return (
    <>
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

        {/* Image thumbnails */}
        {imageSrcs.length > 0 && (
          <div className={`mb-3 flex gap-2 ${imageSrcs.length > 1 ? "flex-wrap" : ""}`}>
            {imageSrcs.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="block rounded-lg overflow-hidden border border-border hover:border-accent/40 transition-colors cursor-pointer"
              >
                <img
                  src={src}
                  alt={`Entry photo ${i + 1}`}
                  className="max-h-48 w-auto object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Content — hide if it's just the camera emoji placeholder */}
        {entry.content && entry.content !== "📷" && (
          <div className={TEXT_ENTRY_CONTENT}>
            <HighlightedText text={entry.content} term={searchTerm} />
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      {lightboxIndex !== null && imageSrcs[lightboxIndex] && (
        <Lightbox
          srcs={imageSrcs}
          index={lightboxIndex}
          alt={`Photo from ${entry.localDate}`}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
