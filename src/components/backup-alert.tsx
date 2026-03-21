"use client";

import { useEffect, useState } from "react";

export default function BackupAlert() {
  const [overdue, setOverdue] = useState(false);
  const [hours, setHours] = useState(0);

  useEffect(() => {
    fetch("/api/backup/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.overdue || data.status === "never" || data.status === "failed") {
          setOverdue(true);
          setHours(data.hoursAgo || 0);
        }
      })
      .catch(() => {});
  }, []);

  if (!overdue) return null;

  return (
    <div className="mt-4 px-3 py-2 rounded bg-signal/10 border border-signal/20 text-center">
      <p className="text-xs text-signal">
        Backup overdue{hours > 0 ? ` (${hours}h ago)` : ""} — data may not be protected
      </p>
    </div>
  );
}
