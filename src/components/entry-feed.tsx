"use client";

import { useEffect, useState, useCallback } from "react";
import EntryCard from "./entry-card";

interface Entry {
  id: string;
  content: string;
  category: string;
  tags: string;
  localDate: string;
  localTime: string;
  createdAt: string;
}

interface EntryFeedProps {
  category: string;
  topic: string;
  search: string;
  refreshKey: number;
}

export default function EntryFeed({ category, topic, search, refreshKey }: EntryFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (topic !== "all") params.set("topic", topic);
    if (search) params.set("search", search);

    const res = await fetch(`/api/entries?${params}`);
    const data = await res.json();
    setEntries(data.entries);
    setTotal(data.total);
    setLoading(false);
  }, [category, topic, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refreshKey]);

  async function handleDelete(id: string) {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  if (loading && entries.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="font-mono text-xs text-text-faint tracking-wider">
          loading...
        </span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3 opacity-30">&#x1F344;</div>
        <p className="font-mono text-xs text-text-faint tracking-wider">
          nothing here yet — plant your first thought
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} searchTerm={search} />
      ))}
      {entries.length < total && (
        <p className="text-center font-mono text-sm text-text-faint tracking-wider pt-4">
          showing {entries.length} of {total}
        </p>
      )}
    </div>
  );
}
