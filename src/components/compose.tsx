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
  MIC_BASE,
  MIC_IDLE,
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageFiles.length >= 3) {
      setError("Max 3 photos per entry");
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large — max 10MB");
      return;
    }

    setImageFiles((prev) => [...prev, file]);
    setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if ((!content.trim() && imageFiles.length === 0) || saving) return;
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

      if (hasUrl && imageFiles.length === 0) {
        const urlMatch = content.match(URL_REGEX);
        const url = urlMatch ? urlMatch[0] : "";
        const userNote = content.replace(url, "").trim();

        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, userNote, localDate, localTime }),
        });
      } else if (imageFiles.length > 0) {
        // Multipart upload
        const formData = new FormData();
        formData.append("content", content);
        formData.append("localDate", localDate);
        formData.append("localTime", localTime);
        imageFiles.forEach((file) => formData.append("image", file));

        res = await fetch("/api/entries", {
          method: "POST",
          body: formData,
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
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviews([]);
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
        className={`${COMPOSE_BOX} ${listening || hasUrl || imageFiles.length > 0 ? COMPOSE_BOX_ACTIVE : COMPOSE_BOX_IDLE}`}
      >
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
          {listening && interim && (
            <div className="mt-1 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse shrink-0" />
              <span className="text-sm text-text-muted italic truncate">
                {interim}
              </span>
            </div>
          )}
        </div>

        {/* Image previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative inline-block">
                <img
                  src={preview}
                  alt={`Upload preview ${i + 1}`}
                  className="max-h-32 rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-border
                    flex items-center justify-center text-text-faint hover:text-signal hover:border-signal/40 transition-all"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Emotional guidance */}
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
            ) : imageFiles.length > 0 ? (
              <span className="text-accent">
                {imageFiles.length} photo{imageFiles.length > 1 ? "s" : ""} attached{imageFiles.length < 3 ? " — add more or" : ""}{content.trim() ? "" : " add a thought or"} plant as-is
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
            {/* Photo button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${MIC_BASE} ${MIC_IDLE}`}
              title="Add photo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            <MicButton
              onTranscript={handleTranscript}
              onInterim={handleInterim}
              onListeningChange={handleListeningChange}
            />
            <button
              onClick={handleSave}
              disabled={(!content.trim() && imageFiles.length === 0) || saving}
              className={`${BTN_PRIMARY} disabled:hover:bg-transparent disabled:hover:text-accent`}
            >
              {saving && hasUrl ? "analyzing..." : saving ? "..." : hasUrl && imageFiles.length === 0 ? "analyze" : "plant"}
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
