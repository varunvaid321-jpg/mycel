"use client";

import { useState, useCallback } from "react";
import Compose from "@/components/compose";
import Filters from "@/components/filters";
import EntryFeed from "@/components/entry-feed";
import WeeklySummary from "@/components/weekly-summary";

export default function Home() {
  const [category, setCategory] = useState("all");
  const [topic, setTopic] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl tracking-[0.1em] lowercase text-accent font-normal">
                mycel
              </h1>
              <p className="text-sm italic text-text-muted mt-0.5">
                Ideas spread quietly.
              </p>
            </div>
            <span className="font-mono text-[0.65rem] text-text-faint tracking-wide">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Compose */}
        <Compose onSaved={handleSaved} />

        {/* Weekly Summary */}
        <WeeklySummary key={refreshKey} />

        {/* Filters + Search */}
        <Filters
          activeCategory={category}
          onCategoryChange={setCategory}
          activeTopic={topic}
          onTopicChange={setTopic}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Feed */}
        <EntryFeed
          category={category}
          topic={topic}
          search={search}
          refreshKey={refreshKey}
        />

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <span className="font-mono text-[0.55rem] text-text-faint tracking-[0.2em]">
            mycel &middot; private by default
          </span>
        </footer>
      </div>
    </div>
  );
}
