"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import MicButton from "./mic-button";
import { detectEmotion } from "@/lib/emotional-detect";
import {
  INPUT_TEXTAREA,
  BTN_PRIMARY,
  ALERT_SIGNAL,
  TEXT_META,
  TEXT_STATUS_FRUIT,
  TEXT_STATUS_SIGNAL,
  COMPOSE_BOX,
  COMPOSE_BOX_ACTIVE,
  COMPOSE_BOX_IDLE,
} from "@/lib/design-tokens";

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
  const emotion = useMemo(() => detectEmotion(content), [content]);

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
        timeZone: "America/Toronto",
      });
      const localTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Toronto",
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

  return (
    <div className="mb-8">
      <div
        className={`${COMPOSE_BOX} ${listening || hasUrl ? COMPOSE_BOX_ACTIVE : COMPOSE_BOX_IDLE}`}
      >
        {/* Show textarea when not listening, or when listening show the live text */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError("");
              autoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "listening..." : "type a thought, paste a link, or speak..."}
            rows={3}
            className={`${INPUT_TEXTAREA} ${listening ? "placeholder:text-signal" : ""}`}
          />
          {/* Live interim text shown below textarea */}
          {listening && interim && (
            <div className="mt-1 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse shrink-0" />
              <span className="text-sm text-text-muted italic truncate">
                {interim}
              </span>
            </div>
          )}
        </div>

        {/* Emotional guidance — instant, before save */}
        {emotion.detected && (
          <div className={`mt-3 px-3 py-2.5 ${ALERT_SIGNAL} animate-fade-in`}>
            <p className="text-sm text-text-primary leading-relaxed">
              <span className="text-signal font-mono text-xs mr-2">&#9679;</span>
              {emotion.guidance}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
          <p className={TEXT_META}>
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
              disabled={!content.trim() || saving}
              className={`${BTN_PRIMARY} disabled:hover:bg-transparent disabled:hover:text-accent`}
            >
              {saving && hasUrl ? "analyzing..." : saving ? "..." : hasUrl ? "analyze" : "plant"}
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mt-2 text-center animate-saved">
          <span className={TEXT_STATUS_FRUIT}>
            planted
          </span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-center">
          <span className={TEXT_STATUS_SIGNAL}>
            {error}
          </span>
        </div>
      )}

      <p className={`mt-2 text-right ${TEXT_META}`}>
        &#8984;+enter to save
      </p>
    </div>
  );
}
