"use client";

import { useState, useRef, useCallback } from "react";
import MicButton from "./mic-button";

interface ComposeProps {
  onSaved: () => void;
}

export default function Compose({ onSaved }: ComposeProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = useCallback((text: string) => {
    setContent((prev) => (prev ? prev + " " + text : text));
    textareaRef.current?.focus();
  }, []);

  async function handleSave() {
    if (!content.trim() || saving) return;
    setSaving(true);
    setError("");

    try {
      const now = new Date();
      const localDate = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const localTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, localDate, localTime }),
      });

      if (!res.ok) {
        setError("Failed to save — try again");
        setSaving(false);
        return;
      }

      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      onSaved();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setError("Connection error — try again");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSave();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  return (
    <div className="mb-8">
      <div className="bg-surface border border-border rounded-lg p-4 transition-colors focus-within:border-accent/60">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError("");
            autoResize(e.target);
          }}
          onKeyDown={handleKeyDown}
          placeholder="what's growing in the dark..."
          rows={3}
          className="w-full bg-transparent text-text-primary text-lg leading-relaxed
            resize-none outline-none placeholder:text-text-faint placeholder:italic font-serif"
        />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <p className="font-mono text-[0.6rem] text-text-faint tracking-wide">
            auto-categorized on save
          </p>

          <div className="flex items-center gap-2">
            <MicButton onTranscript={handleTranscript} />
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="bg-transparent border border-accent text-accent rounded px-4 py-1.5
                font-mono text-[0.7rem] tracking-[0.15em] uppercase transition-all
                hover:bg-accent hover:text-bg disabled:opacity-30 disabled:hover:bg-transparent
                disabled:hover:text-accent"
            >
              {saving ? "..." : "plant"}
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mt-2 text-center animate-saved">
          <span className="font-mono text-xs text-fruit tracking-wider">
            planted
          </span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-center">
          <span className="font-mono text-xs text-signal tracking-wider">
            {error}
          </span>
        </div>
      )}

      <p className="mt-2 text-right font-mono text-[0.6rem] text-text-faint tracking-wide">
        &#8984;+enter to save
      </p>
    </div>
  );
}
