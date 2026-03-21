"use client";

import { useState } from "react";
import { CATEGORY_KEYS, CATEGORIES } from "@/lib/categories";
import { TOPICS, type Topic } from "@/lib/classifier";
import {
  BTN_PILL_INACTIVE,
  BTN_PILL_ACTIVE_CATEGORY,
  BTN_PILL_ACTIVE_TOPIC,
  INPUT_TEXT,
  BTN_SEARCH_GO,
  BTN_SEARCH_CLEAR,
  TEXT_FILTER_LABEL,
  FILTER_ROW,
  FILTER_SECTION,
} from "@/lib/design-tokens";

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
    <div className={FILTER_SECTION}>
      {/* Type filter row */}
      <div className={FILTER_ROW}>
        <span className={TEXT_FILTER_LABEL}>
          type
        </span>
        <button
          onClick={() => onCategoryChange("all")}
          className={activeCategory === "all" ? BTN_PILL_ACTIVE_CATEGORY : BTN_PILL_INACTIVE}
        >
          all
        </button>
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={activeCategory === key ? BTN_PILL_ACTIVE_CATEGORY : BTN_PILL_INACTIVE}
          >
            {CATEGORIES[key].label}
          </button>
        ))}
      </div>

      {/* Topic filter row */}
      <div className={FILTER_ROW}>
        <span className={TEXT_FILTER_LABEL}>
          life
        </span>
        <button
          onClick={() => onTopicChange("all")}
          className={activeTopic === "all" ? BTN_PILL_ACTIVE_TOPIC : BTN_PILL_INACTIVE}
        >
          all
        </button>
        {TOPIC_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onTopicChange(key)}
            className={activeTopic === key ? BTN_PILL_ACTIVE_TOPIC : BTN_PILL_INACTIVE}
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
          className={`flex-1 sm:flex-none sm:w-56 ${INPUT_TEXT} sm:text-xs`}
        />
        <button
          onClick={submitSearch}
          className={BTN_SEARCH_GO}
        >
          go
        </button>
        {search && (
          <button
            onClick={clearSearch}
            className={BTN_SEARCH_CLEAR}
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
}
