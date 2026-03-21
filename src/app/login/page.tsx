"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
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
                className={`flex-1 bg-surface border border-border border-r-0 rounded-l px-4 py-3 min-h-[44px]
                  font-mono text-base sm:text-sm text-text-primary tracking-wider placeholder:text-text-faint
                  outline-none transition-colors focus:border-accent
                  ${error ? "border-signal" : ""}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-accent border border-accent rounded-r px-5 py-3 min-h-[44px] text-bg font-mono
                  text-sm sm:text-xs tracking-[0.15em] uppercase transition-opacity hover:opacity-85
                  disabled:opacity-50"
              >
                {loading ? "..." : "enter"}
              </button>
            </div>
          ) : (
            /* Security challenge */
            <div className="space-y-4">
              <div className="bg-signal/10 border border-signal/30 rounded-lg px-4 py-3">
                <p className="font-mono text-[0.65rem] text-signal tracking-wider uppercase mb-1">
                  unusual location
                </p>
                <p className="text-sm text-text-muted">
                  {challenge.location}
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
                  className={`flex-1 bg-surface border border-border border-r-0 rounded-l px-4 py-3 min-h-[44px]
                    font-mono text-base sm:text-sm text-text-primary tracking-wider placeholder:text-text-faint
                    outline-none transition-colors focus:border-accent
                    ${error ? "border-signal" : ""}`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-accent border border-accent rounded-r px-5 py-3 min-h-[44px] text-bg font-mono
                    text-sm sm:text-xs tracking-[0.15em] uppercase transition-opacity hover:opacity-85
                    disabled:opacity-50"
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

      <div className="absolute bottom-8 font-mono text-[0.65rem] text-text-faint tracking-[0.2em]">
        no names &middot; no traces &middot; just growth
      </div>
    </div>
  );
}
