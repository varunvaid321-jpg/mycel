"use client";

import { useEffect, useCallback } from "react";

interface LightboxProps {
  srcs: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ srcs, index, alt, onClose, onNavigate }: LightboxProps) {
  const canPrev = index > 0;
  const canNext = index < srcs.length - 1;
  const multi = srcs.length > 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && canPrev) onNavigate(index - 1);
      if (e.key === "ArrowRight" && canNext) onNavigate(index + 1);
    },
    [onClose, onNavigate, index, canPrev, canNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full
          border border-border bg-surface flex items-center justify-center
          text-text-muted hover:text-signal hover:border-signal/40 transition-all z-10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Previous button */}
      {multi && canPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
          className="absolute left-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full
            border border-border bg-surface flex items-center justify-center
            text-text-muted hover:text-signal hover:border-signal/40 transition-all z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {multi && canNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
          className="absolute right-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full
            border border-border bg-surface flex items-center justify-center
            text-text-muted hover:text-signal hover:border-signal/40 transition-all z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={srcs[index]}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Dots indicator */}
      {multi && (
        <div className="absolute bottom-6 flex gap-2">
          {srcs.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === index ? "bg-accent" : "bg-text-faint/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
