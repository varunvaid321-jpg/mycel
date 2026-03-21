"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BTN_ACCENT_SOLID,
  TEXT_STATUS_SIGNAL,
  TEXT_FOOTER,
} from "@/lib/design-tokens";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface ScreenLockProps {
  children: React.ReactNode;
}

export default function ScreenLock({ children }: ScreenLockProps) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lockoutSec, setLockoutSec] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lock = useCallback(() => {
    setLocked(true);
    setPin("");
    setError("");
    setRemaining(null);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(lock, IDLE_TIMEOUT_MS);
  }, [lock]);

  useEffect(() => {
    // Lock on tab hidden (phone lock, tab switch)
    function handleVisibility() {
      if (document.hidden) {
        lock();
      }
    }

    // Reset idle timer on any interaction
    function handleActivity() {
      if (!locked) resetIdleTimer();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("touchstart", handleActivity);
    document.addEventListener("mousedown", handleActivity);
    document.addEventListener("keydown", handleActivity);
    document.addEventListener("scroll", handleActivity);

    // Start idle timer
    resetIdleTimer();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("mousedown", handleActivity);
      document.removeEventListener("keydown", handleActivity);
      document.removeEventListener("scroll", handleActivity);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [locked, lock, resetIdleTimer]);

  // Focus input when locked
  useEffect(() => {
    if (locked && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [locked]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec((s) => {
        if (s <= 1) {
          setError("");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || verifying || lockoutSec > 0) return;

    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (data.ok) {
        setLocked(false);
        setPin("");
        setError("");
        setRemaining(null);
        resetIdleTimer();
        return;
      }

      if (data.error === "locked") {
        setLockoutSec(data.remainingSec || 300);
        setError("Too many attempts — locked");
        setPin("");
      } else if (data.error === "wrong") {
        setError("Wrong PIN");
        setRemaining(data.remaining);
        setPin("");
      }
    } catch {
      setError("Connection error");
    } finally {
      setVerifying(false);
    }
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center">
      <div className="text-center px-6 w-full max-w-[300px]">
        <div className="text-5xl mb-4 opacity-40">&#x1F510;</div>
        <h2 className="text-2xl tracking-[0.1em] lowercase text-accent font-normal mb-1">
          mycel
        </h2>
        <p className="text-sm italic text-text-muted mb-8">locked</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(val);
              setError("");
            }}
            placeholder="PIN"
            autoComplete="off"
            disabled={lockoutSec > 0}
            className="w-full bg-surface border border-border rounded-lg px-4 py-4 text-center
              font-mono text-2xl tracking-[0.5em] text-text-primary
              placeholder:text-text-faint placeholder:tracking-[0.3em] placeholder:text-lg
              outline-none focus:border-accent/50 transition-colors
              disabled:opacity-30"
          />

          <button
            type="submit"
            disabled={pin.length < 4 || verifying || lockoutSec > 0}
            className={`w-full mt-4 ${BTN_ACCENT_SOLID} rounded-lg disabled:opacity-30`}
          >
            {lockoutSec > 0
              ? `locked (${Math.floor(lockoutSec / 60)}:${String(lockoutSec % 60).padStart(2, "0")})`
              : verifying
                ? "..."
                : "unlock"}
          </button>
        </form>

        {error && (
          <p className={`mt-3 ${TEXT_STATUS_SIGNAL}`}>
            {error}
          </p>
        )}

        {remaining != null && remaining > 0 && (
          <p className="mt-1 font-mono text-xs text-text-faint">
            {remaining} attempt{remaining !== 1 ? "s" : ""} left
          </p>
        )}
      </div>

      <div className={`absolute bottom-8 ${TEXT_FOOTER}`}>
        private by default
      </div>
    </div>
  );
}
