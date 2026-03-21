"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  INPUT_PASSWORD,
  BTN_ACCENT_SOLID,
  ALERT_SIGNAL_STRONG,
  TEXT_STATUS_SIGNAL,
  TEXT_TAGLINE,
  TEXT_FOOTER,
  TEXT_META,
} from "@/lib/design-tokens";

export default function LoginPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Geo challenge
  const [challenge, setChallenge] = useState<{
    question: string;
  } | null>(null);
  const [secretAnswer, setSecretAnswer] = useState("");

  // Lockout recovery
  const [locked, setLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [recoveryQuestions, setRecoveryQuestions] = useState<string[]>([]);
  const [recoveryAnswers, setRecoveryAnswers] = useState<string[]>(["", "", ""]);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, unknown> = { passphrase };
    if (challenge) body.secretAnswer = secretAnswer;

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

    if (data.error === "locked") {
      setLocked(true);
      setLockMessage(data.message);
      setRecoveryQuestions(data.questions || []);
      setLoading(false);
      return;
    }

    if (data.error === "location_challenge") {
      setChallenge({ question: data.question });
      setLoading(false);
      return;
    }

    if (data.error === "invalid_answer") {
      setError("wrong answer");
      if (data.remaining != null) setRemaining(data.remaining);
    } else if (data.error === "invalid") {
      setRemaining(data.remaining ?? null);
      setError(
        data.remaining != null
          ? `wrong passphrase — ${data.remaining} attempts left`
          : "wrong passphrase"
      );
    } else {
      setError(data.message || "error");
    }

    setLoading(false);
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase: "", recoveryAnswers }),
    });

    const data = await res.json();

    if (data.error === "recovery_success") {
      setRecoverySuccess(true);
      setLocked(false);
      setError("");
      setPassphrase("");
    } else {
      setError("wrong answers — still locked");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div className="absolute w-[600px] h-[400px] left-[10%] top-[40%] bg-accent rounded-full blur-[150px]" />
        <div className="absolute w-[400px] h-[500px] right-[10%] top-[20%] bg-network rounded-full blur-[150px]" />
      </div>

      <div className="text-center z-10 px-6 w-full max-w-[400px]">
        <div className="text-6xl mb-6 opacity-60">&#x1F344;</div>
        <h1 className="text-5xl md:text-6xl font-normal tracking-[0.12em] lowercase text-accent mb-2">
          mycel
        </h1>
        <p className={`${TEXT_TAGLINE} text-base tracking-wide mb-12`}>
          Ideas spread quietly.
        </p>

        {locked ? (
          /* ── Lockout recovery ── */
          <form onSubmit={handleRecovery} className="space-y-4 text-left">
            <div className={ALERT_SIGNAL_STRONG}>
              <p className={`${TEXT_STATUS_SIGNAL} uppercase mb-1`}>
                account locked
              </p>
              <p className="text-sm text-text-muted">{lockMessage}</p>
            </div>

            <p className="text-sm text-text-primary">
              Answer all 3 questions to unlock:
            </p>

            {recoveryQuestions.map((q, i) => (
              <div key={i}>
                <label className="block text-sm text-text-muted mb-1">{q}</label>
                <input
                  type="text"
                  value={recoveryAnswers[i]}
                  onChange={(e) => {
                    const updated = [...recoveryAnswers];
                    updated[i] = e.target.value;
                    setRecoveryAnswers(updated);
                  }}
                  autoComplete="off"
                  className={`w-full ${INPUT_PASSWORD} rounded border-r`}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading || recoveryAnswers.some((a) => !a.trim())}
              className={`w-full ${BTN_ACCENT_SOLID} rounded`}
            >
              {loading ? "..." : "unlock"}
            </button>
          </form>
        ) : !challenge ? (
          /* ── Normal passphrase ── */
          <form onSubmit={handleSubmit} className="w-full">
            {recoverySuccess && (
              <p className="mb-4 font-mono text-sm text-fruit tracking-wide">
                Identity verified — enter your passphrase
              </p>
            )}
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
          </form>
        ) : (
          /* ── Geo challenge ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={ALERT_SIGNAL_STRONG}>
              <p className={`${TEXT_STATUS_SIGNAL} uppercase mb-1`}>
                security check
              </p>
              <p className="text-sm text-text-muted">
                Login from outside your usual area.
              </p>
            </div>
            <p className="text-sm text-text-primary italic">{challenge.question}</p>
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
          </form>
        )}

        {error && (
          <p className={`mt-3 ${TEXT_STATUS_SIGNAL}`}>
            {error}
          </p>
        )}

        {remaining != null && remaining > 0 && remaining < MAX_DISPLAY && (
          <p className={`mt-1 ${TEXT_META}`}>
            {remaining} attempts remaining
          </p>
        )}
      </div>

      <div className={`absolute bottom-8 ${TEXT_FOOTER}`}>
        no names &middot; no traces &middot; just growth
      </div>
    </div>
  );
}

const MAX_DISPLAY = 4;
