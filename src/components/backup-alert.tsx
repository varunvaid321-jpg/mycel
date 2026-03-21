"use client";

import { useEffect, useState } from "react";
import { ALERT_SIGNAL, TEXT_STATUS_SIGNAL } from "@/lib/design-tokens";

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
    <div className={`mt-4 px-3 py-2 text-center ${ALERT_SIGNAL}`}>
      <p className={TEXT_STATUS_SIGNAL}>
        Backup overdue{hours > 0 ? ` (${hours}h ago)` : ""} — data may not be protected
      </p>
    </div>
  );
}
