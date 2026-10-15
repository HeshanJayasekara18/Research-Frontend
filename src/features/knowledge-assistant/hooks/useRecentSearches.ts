"use client";

import { useCallback, useEffect, useState } from "react";

import type { RetrievalMethod } from "../api/types";

export interface RecentSearch {
  id: string;
  query: string;
  videoId: string | null;
  method: RetrievalMethod;
  at: number;
}

// Per-browser convenience only (never synced, never sent to the server).
const KEY = "c3.knowledge-assistant.recent.v1";
const MAX = 12;

function read(): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentSearch[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(items: RecentSearch[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode): history just won't persist */
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearch[]>([]);

  useEffect(() => setItems(read()), []);

  const add = useCallback((s: Omit<RecentSearch, "id" | "at">) => {
    setItems((prev) => {
      const next = [
        { ...s, id: crypto.randomUUID(), at: Date.now() },
        ...prev.filter((p) => !(p.query === s.query && p.videoId === s.videoId)),
      ].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { items, add, clear, remove };
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}
