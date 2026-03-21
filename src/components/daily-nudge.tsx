"use client";

import { useEffect, useState } from "react";

interface GuideData {
  message: string;
  type: "insight" | "action" | "reflection";
  intensity: "gentle" | "warm" | "direct";
}

const typeIcons: Record<string, string> = {
  insight: "~",
  action: "→",
  reflection: "·",
};

const intensityStyles: Record<string, string> = {
  gentle: "border-text-faint/20 text-text-muted",
  warm: "border-accent/30 text-text-primary",
  direct: "border-signal/30 text-text-primary",
};

const intensityAccent: Record<string, string> = {
  gentle: "text-text-faint",
  warm: "text-accent",
  direct: "text-signal",
};

export default function DailyNudge() {
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (within 4 hours)
    const dismissedAt = localStorage.getItem("guide_dismissed_at");
    if (dismissedAt) {
      const hours = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hours < 4) {
        setDismissed(true);
        return;
      }
    }

    fetch("/api/guide")
      .then((r) => r.json())
      .then((data) => {
        if (data.guide) {
          setGuide(data.guide);
          setTimeout(() => setVisible(true), 300);
        }
      })
      .catch(() => {});
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      localStorage.setItem("guide_dismissed_at", String(Date.now()));
    }, 300);
  }

  if (dismissed || !guide) return null;

  const icon = typeIcons[guide.type] || "·";
  const style = intensityStyles[guide.intensity] || intensityStyles.gentle;
  const accent = intensityAccent[guide.intensity] || intensityAccent.gentle;

  return (
    <div
      className={`mb-6 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${style} bg-surface/50`}
      >
        <span className={`font-mono text-sm mt-0.5 shrink-0 ${accent}`}>
          {icon}
        </span>
        <p className="text-sm leading-relaxed flex-1 italic">
          {guide.message}
        </p>
        <button
          onClick={handleDismiss}
          className="font-mono text-[0.6rem] text-text-faint hover:text-text-muted transition-colors shrink-0 mt-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
