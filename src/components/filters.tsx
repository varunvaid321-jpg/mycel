"use client";

import { useState } from "react";
import { CATEGORY_KEYS, CATEGORIES } from "@/lib/categories";
import { TOPICS, type Topic } from "@/lib/classifier";

const TOPIC_KEYS = Object.keys(TOPICS) as Topic[];

interface FiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activeTopic: string;
  onTopicChange: (topic: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function Filters({
  activeCategory,
  onCategoryChange,
  activeTopic,
  onTopicChange,
  search,
  onSearchChange,
}: FiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);

  function submitSearch() {
    onSearchChange(localSearch);
  }

  function clearSearch() {
    setLocalSearch("");
    onSearchChange("");
  }

  return (
    <div className="mb-5 pb-4 border-b border-border space-y-3">
      {/* Type filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-text-faint w-10 shrink-0">
          type
        </span>
        <button
          onClick={() => onCategoryChange("all")}
          className={`px-2.5 py-1 rounded-full font-mono text-[0.6rem] tracking-wider uppercase
            border transition-all
            ${activeCategory === "all" ? "border-text-muted text-text-primary bg-surface-hover" : "border-border text-text-faint hover:text-text-muted"}`}
        >
          all
        </button>
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`px-2.5 py-1 rounded-full font-mono text-[0.6rem] tracking-wider uppercase
              border transition-all
              ${activeCategory === key ? "border-text-muted text-text-primary bg-surface-hover" : "border-border text-text-faint hover:text-text-muted"}`}
          >
            {CATEGORIES[key].label}
          </button>
        ))}
      </div>

      {/* Topic filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-text-faint w-10 shrink-0">
          life
        </span>
        <button
          onClick={() => onTopicChange("all")}
          className={`px-2.5 py-1 rounded-full font-mono text-[0.6rem] tracking-wider uppercase
            border transition-all
            ${activeTopic === "all" ? "border-accent/50 text-accent bg-accent/10" : "border-border text-text-faint hover:text-text-muted"}`}
        >
          all
        </button>
        {TOPIC_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onTopicChange(key)}
            className={`px-2.5 py-1 rounded-full font-mono text-[0.6rem] tracking-wider uppercase
              border transition-all
              ${activeTopic === key ? "border-accent/50 text-accent bg-accent/10" : "border-border text-text-faint hover:text-text-muted"}`}
          >
            {TOPICS[key].label}
          </button>
        ))}
      </div>

      {/* Search with button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitSearch();
          }}
          placeholder="search entries..."
          className="flex-1 sm:flex-none sm:w-56 bg-surface border border-border rounded px-3 py-1.5
            font-mono text-xs text-text-primary tracking-wide placeholder:text-text-faint
            outline-none focus:border-accent/50 transition-colors"
        />
        <button
          onClick={submitSearch}
          className="px-3 py-1.5 bg-surface border border-accent/40 text-accent rounded
            font-mono text-[0.65rem] tracking-wider uppercase transition-all
            hover:bg-accent hover:text-bg"
        >
          go
        </button>
        {search && (
          <button
            onClick={clearSearch}
            className="px-2 py-1.5 font-mono text-[0.65rem] text-text-faint hover:text-signal transition-colors"
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
}
