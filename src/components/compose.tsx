"use client";

import { useState, useRef, useCallback } from "react";
import MicButton from "./mic-button";

interface ComposeProps {
  onSaved: () => void;
}

const URL_REGEX = /https?:\/\/[^\s]+/;

export default function Compose({ onSaved }: ComposeProps) {
  const [content, setContent] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUrl = URL_REGEX.test(content.trim());

  const handleTranscript = useCallback((text: string) => {
    setContent((prev) => (prev ? prev + " " + text : text));
  }, []);

  const handleInterim = useCallback((text: string) => {
    setInterim(text);
  }, []);

  const handleListeningChange = useCallback((isListening: boolean) => {
    setListening(isListening);
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

      if (hasUrl) {
        const urlMatch = content.match(URL_REGEX);
        const url = urlMatch ? urlMatch[0] : "";
        const userNote = content.replace(url, "").trim();

        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, userNote, localDate, localTime }),
        });
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
      setInterim("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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

  // Display text = committed content + live interim in a different style
  const displayValue = content + (interim ? (content ? " " : "") + interim : "");

  return (
    <div className="mb-8">
      <div
        className={`bg-surface border rounded-lg p-4 transition-colors focus-within:border-accent/60
          ${listening ? "border-signal/40" : hasUrl ? "border-signal/40" : "border-border"}`}
      >
        {/* Show textarea when not listening, or when listening show the live text */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={listening ? displayValue : content}
            onChange={(e) => {
              if (!listening) {
                setContent(e.target.value);
                setError("");
                autoResize(e.target);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "listening..." : "type a thought, paste a link, or speak..."}
            rows={3}
            readOnly={listening}
            className={`w-full bg-transparent text-lg leading-relaxed
              resize-none outline-none placeholder:italic font-serif
              ${listening ? "text-text-primary placeholder:text-signal" : "text-text-primary placeholder:text-text-faint"}`}
          />
          {/* Interim text highlight overlay */}
          {listening && interim && (
            <div className="absolute bottom-0 right-0 mb-1 mr-1">
              <span className="inline-flex items-center gap-1 font-mono text-[0.6rem] text-signal">
                <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
                hearing...
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
          <p className="font-mono text-[0.6rem] text-text-faint tracking-wide">
            {listening ? (
              <span className="text-signal flex items-center gap-1.5">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-signal animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full bg-signal animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full bg-signal animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                speaking — tap mic to stop
              </span>
            ) : hasUrl ? (
              <span className="text-signal">
                link detected — will analyze content
              </span>
            ) : (
              "auto-categorized on save"
            )}
          </p>

          <div className="flex items-center gap-2">
            <MicButton
              onTranscript={handleTranscript}
              onInterim={handleInterim}
              onListeningChange={handleListeningChange}
            />
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving || listening}
              className="bg-transparent border border-accent text-accent rounded px-4 py-2.5 min-h-[44px]
                font-mono text-[0.7rem] tracking-[0.15em] uppercase transition-all
                hover:bg-accent hover:text-bg disabled:opacity-30 disabled:hover:bg-transparent
                disabled:hover:text-accent"
            >
              {saving && hasUrl ? "analyzing..." : saving ? "..." : hasUrl ? "analyze" : "plant"}
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
