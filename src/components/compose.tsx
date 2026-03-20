"use client";

import { useState, useRef, useCallback } from "react";
import MicButton from "./mic-button";

interface ComposeProps {
  onSaved: () => void;
}

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

export default function Compose({ onSaved }: ComposeProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isYouTube = YT_REGEX.test(content.trim());

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

      let res: Response;

      if (isYouTube) {
        // Extract the URL from the content
        const urlMatch = content.match(
          /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[^\s]+/
        );
        const url = urlMatch ? urlMatch[0] : content.trim();

        // Get the user's note (everything that's not the URL)
        const userNote = content.replace(url, "").trim();

        setAnalyzing(true);
        res = await fetch("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, userNote, localDate, localTime }),
        });
        setAnalyzing(false);
      } else {
        res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, localDate, localTime }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save — try again");
        setSaving(false);
        return;
      }

      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setError("Connection error — try again");
      setAnalyzing(false);
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
      <div
        className={`bg-surface border rounded-lg p-4 transition-colors focus-within:border-accent/60
          ${isYouTube ? "border-signal/40" : "border-border"}`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError("");
            autoResize(e.target);
          }}
          onKeyDown={handleKeyDown}
          placeholder="what's growing in the dark... (paste a YouTube link to analyze)"
          rows={3}
          className="w-full bg-transparent text-text-primary text-lg leading-relaxed
            resize-none outline-none placeholder:text-text-faint placeholder:italic font-serif"
        />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <p className="font-mono text-[0.6rem] text-text-faint tracking-wide">
            {isYouTube ? (
              <span className="text-signal">
                youtube detected — will analyze transcript
              </span>
            ) : (
              "auto-categorized on save"
            )}
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
              {analyzing ? "analyzing..." : saving ? "..." : isYouTube ? "analyze" : "plant"}
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mt-2 text-center animate-saved">
          <span className="font-mono text-xs text-fruit tracking-wider">
            {isYouTube ? "analyzed & planted" : "planted"}
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
