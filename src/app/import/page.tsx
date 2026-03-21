"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PAGE_CONTAINER,
  CARD,
  CARD_PADDING,
  INPUT_TEXTAREA,
  BTN_IMPORT,
  BTN_TEXT_LINK,
  TEXT_META,
  TEXT_EMPTY,
  TEXT_STATUS_SIGNAL,
  TEXT_STATUS_FRUIT,
} from "@/lib/design-tokens";

export default function ImportPage() {
  const [raw, setRaw] = useState("");
  const [jsonFile, setJsonFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    details: { content: string; category: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  function parseMemories(): string[] {
    // Try JSON first (ChatGPT export format)
    if (jsonFile) {
      try {
        const parsed = JSON.parse(jsonFile);
        // Handle various JSON formats
        if (Array.isArray(parsed)) {
          return parsed.map((m) =>
            typeof m === "string" ? m : m.text || m.content || m.memory || m.value || JSON.stringify(m)
          );
        }
        if (parsed.memories && Array.isArray(parsed.memories)) {
          return parsed.memories.map((m: Record<string, string>) =>
            typeof m === "string" ? m : m.text || m.content || m.memory || ""
          );
        }
      } catch {
        // Not JSON, treat as text
      }
    }

    // Parse pasted text — one memory per line
    return raw
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length >= 3);
  }

  async function handleImport() {
    setError("");
    setImporting(true);

    const memories = parseMemories();
    if (memories.length === 0) {
      setError("No memories found. Paste text (one per line) or upload a JSON file.");
      setImporting(false);
      return;
    }

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories, source: "chatgpt" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Import failed");
        setImporting(false);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Connection error");
    } finally {
      setImporting(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonFile(reader.result as string);
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl text-accent font-medium">Import Memories</h1>
            <p className="text-sm text-text-muted mt-1">
              Bring in your thoughts from ChatGPT or anywhere else.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className={BTN_TEXT_LINK}
          >
            &larr; back
          </button>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className={`${CARD} ${CARD_PADDING}`}>
              <h2 className="text-base font-medium text-text-primary mb-3">How to export from ChatGPT</h2>
              <ol className="space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <span className="text-accent font-medium shrink-0">1.</span>
                  Go to chatgpt.com &rarr; Settings &rarr; Personalization &rarr; Memory &rarr; Manage
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-medium shrink-0">2.</span>
                  Select all memories and copy the text
                </li>
                <li className="flex gap-2">
                  <span className="text-accent font-medium shrink-0">3.</span>
                  Paste below — one memory per line
                </li>
              </ol>
              <p className={`${TEXT_EMPTY} mt-3`}>
                Or: Settings &rarr; Data Controls &rarr; Export Data &rarr; upload the JSON file below.
              </p>
            </div>

            {/* Paste area */}
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Paste memories (one per line)
              </label>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={"User prefers dark mode\nUser lives in Toronto with family\nUser works at GM in infotainment\n..."}
                rows={12}
                className={`${INPUT_TEXTAREA} bg-surface border border-border rounded-lg px-4 py-3 text-sm leading-relaxed resize-y focus:border-accent/50 transition-colors`}
              />
              <p className={`${TEXT_EMPTY} mt-1`}>
                {raw.split("\n").filter((l) => l.trim().length >= 3).length} memories detected
              </p>
            </div>

            {/* Or upload JSON */}
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Or upload ChatGPT export JSON
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full text-sm text-text-faint file:mr-4 file:py-2 file:px-4
                  file:rounded file:border file:border-border file:bg-surface file:text-text-muted
                  file:text-sm hover:file:bg-surface-hover file:transition-colors file:cursor-pointer"
              />
              {jsonFile && (
                <p className={`${TEXT_STATUS_FRUIT} mt-1`}>File loaded — ready to import</p>
              )}
            </div>

            {error && (
              <p className={TEXT_STATUS_SIGNAL}>{error}</p>
            )}

            <button
              onClick={handleImport}
              disabled={importing || (!raw.trim() && !jsonFile)}
              className={BTN_IMPORT}
            >
              {importing ? "Importing..." : "Import to Mycel"}
            </button>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="bg-fruit/10 border border-fruit/30 rounded-lg p-5 text-center">
              <p className="text-2xl text-fruit font-medium">{result.imported} imported</p>
              {result.skipped > 0 && (
                <p className={`${TEXT_META} mt-1`}>{result.skipped} skipped (duplicates or empty)</p>
              )}
            </div>

            <div className="space-y-2">
              {result.details.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-fruit">&#10003;</span>
                  <span className={`${TEXT_EMPTY} uppercase w-16 shrink-0`}>{d.category}</span>
                  <span className="text-text-primary truncate">{d.content}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/")}
              className={`${BTN_IMPORT} disabled:opacity-100`}
            >
              Go to Journal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
