"use client";

import { useEffect, useState } from "react";

export default function DailyNudge() {
  const [nudge, setNudge] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed today
    const today = new Date().toISOString().slice(0, 10);
    const dismissedDate = localStorage.getItem("nudge_dismissed");
    if (dismissedDate === today) {
      setDismissed(true);
      return;
    }

    fetch("/api/nudge")
      .then((r) => r.json())
      .then((data) => {
        if (data.nudge) setNudge(data.nudge);
      })
      .catch(() => {});
  }, []);

  function handleDismiss() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("nudge_dismissed", today);
    setDismissed(true);
  }

  if (!nudge || dismissed) return null;

  return (
    <div className="mb-6 bg-spore/10 border border-spore/30 rounded-lg px-4 py-3 flex items-start gap-3 animate-fade-in">
      <span className="text-spore font-mono text-sm mt-0.5 shrink-0">!</span>
      <p className="text-sm leading-relaxed text-text-primary flex-1 font-serif">
        {nudge}
      </p>
      <button
        onClick={handleDismiss}
        className="text-text-faint hover:text-text-muted font-mono text-xs shrink-0"
        title="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
