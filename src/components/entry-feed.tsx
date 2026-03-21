"use client";

import { useEffect, useState, useCallback } from "react";
import EntryCard from "./entry-card";
import { TEXT_EMPTY, TEXT_META } from "@/lib/design-tokens";

interface Entry {
  id: string;
  content: string;
  category: string;
  tags: string;
  localDate: string;
  localTime: string;
  createdAt: string;
  imagePath?: string;
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
        <span className={TEXT_EMPTY}>
          loading...
        </span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3 opacity-30">&#x1F344;</div>
        <p className={TEXT_EMPTY}>
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
        <p className={`text-center pt-4 ${TEXT_META}`}>
          showing {entries.length} of {total}
        </p>
      )}
    </div>
  );
}
