"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DailyNudge from "@/components/daily-nudge";
import Compose from "@/components/compose";
import WeeklySummary from "@/components/weekly-summary";
import MonthlyReview from "@/components/monthly-review";
import Momentum from "@/components/momentum";
import Filters from "@/components/filters";
import EntryFeed from "@/components/entry-feed";
import Decisions from "@/components/decisions";

export default function Home() {
  const [category, setCategory] = useState("all");
  const [topic, setTopic] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDecisions, setShowDecisions] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

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
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-mono text-[0.6rem] sm:text-[0.65rem] text-text-faint tracking-wide hidden sm:inline">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "America/Toronto",
                })}
              </span>
              <span className="font-mono text-[0.6rem] text-text-faint tracking-wide sm:hidden">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "America/Toronto",
                })}
              </span>
              <button
                onClick={handleLogout}
                className="font-mono text-[0.6rem] text-text-faint hover:text-signal
                  tracking-wider transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                log out
              </button>
            </div>
          </div>
        </header>

        {/* Daily Nudge */}
        <DailyNudge />

        {/* Compose */}
        <Compose onSaved={handleSaved} />

        {/* Weekly Summary */}
        <WeeklySummary key={refreshKey} />

        {/* Monthly Review */}
        <MonthlyReview />

        {/* Momentum Heatmap */}
        <Momentum />

        {/* Filters + Search + Decisions toggle */}
        <div className="mb-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowDecisions(false)}
              className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-full font-mono text-[0.6rem] tracking-wider uppercase border transition-all flex items-center ${
                !showDecisions
                  ? "border-text-muted text-text-primary bg-surface-hover"
                  : "border-border text-text-faint hover:text-text-muted"
              }`}
            >
              feed
            </button>
            <button
              onClick={() => setShowDecisions(true)}
              className={`px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-full font-mono text-[0.6rem] tracking-wider uppercase border transition-all flex items-center ${
                showDecisions
                  ? "border-fruit/50 text-fruit bg-fruit/10"
                  : "border-border text-text-faint hover:text-text-muted"
              }`}
            >
              decisions
            </button>
          </div>

          {!showDecisions && (
            <Filters
              activeCategory={category}
              onCategoryChange={setCategory}
              activeTopic={topic}
              onTopicChange={setTopic}
              search={search}
              onSearchChange={setSearch}
            />
          )}
        </div>

        {/* Content */}
        {showDecisions ? (
          <Decisions visible={showDecisions} />
        ) : (
          <EntryFeed
            category={category}
            topic={topic}
            search={search}
            refreshKey={refreshKey}
          />
        )}

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
