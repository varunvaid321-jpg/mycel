"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  INPUT_PASSWORD,
  BTN_ACCENT_SOLID,
  ALERT_SIGNAL_STRONG,
} from "@/lib/design-tokens";

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<{
    question: string;
    location: string;
  } | null>(null);
  const [secretAnswer, setSecretAnswer] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, string> = { passphrase };
    if (challenge) {
      body.secretAnswer = secretAnswer;
    }

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    const data = await res.json();

    if (data.error === "location_challenge") {
      setChallenge({
        question: data.question,
        location: data.location,
      });
      setLoading(false);
      return;
    }

    if (data.error === "invalid_answer") {
      setError("wrong answer");
    } else {
      setError("wrong passphrase");
      setChallenge(null);
      setSecretAnswer("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div className="absolute w-[600px] h-[400px] left-[10%] top-[40%] bg-accent rounded-full blur-[150px]" />
        <div className="absolute w-[400px] h-[500px] right-[10%] top-[20%] bg-network rounded-full blur-[150px]" />
      </div>

      <div className="text-center z-10 px-6">
        <div className="text-6xl mb-6 opacity-60">&#x1F344;</div>
        <h1 className="text-5xl md:text-6xl font-normal tracking-[0.12em] lowercase text-accent mb-2">
          mycel
        </h1>
        <p className="text-base italic text-text-muted tracking-wide mb-12">
          Ideas spread quietly.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-[360px] mx-auto">
          {!challenge ? (
            /* Normal passphrase entry */
            <div className="flex">
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="enter passphrase"
                autoFocus
                className={`${INPUT_PASSWORD} ${error ? "border-signal" : ""}`}
              />
              <button
                type="submit"
                disabled={loading}
                className={`${BTN_ACCENT_SOLID} rounded-l-none rounded-r sm:text-xs`}
              >
                {loading ? "..." : "enter"}
              </button>
            </div>
          ) : (
            /* Security challenge */
            <div className="space-y-4">
              <div className={ALERT_SIGNAL_STRONG}>
                <p className="font-mono text-sm text-signal tracking-wider uppercase mb-1">
                  security check
                </p>
                <p className="text-sm text-text-muted">
                  Login detected from outside your usual area.
                </p>
              </div>

              <p className="text-sm text-text-primary italic">
                {challenge.question}
              </p>

              <div className="flex">
                <input
                  type="text"
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  placeholder="your answer"
                  autoFocus
                  autoComplete="off"
                  className={`${INPUT_PASSWORD} ${error ? "border-signal" : ""}`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`${BTN_ACCENT_SOLID} rounded-l-none rounded-r sm:text-xs`}
                >
                  {loading ? "..." : "verify"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 font-mono text-xs text-signal tracking-wide">
              {error}
            </p>
          )}
        </form>
      </div>

      <div className="absolute bottom-8 font-mono text-sm text-text-faint tracking-[0.2em]">
        no names &middot; no traces &middot; just growth
      </div>
    </div>
  );
}
