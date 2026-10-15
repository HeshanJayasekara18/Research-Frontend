"use client";

import { useCallback, useEffect, useState } from "react";

import type { Turn } from "../components/chat/model";

/** A finished conversation, stored only in this browser (localStorage). */
export interface SavedConversation {
  id: string;
  title: string;
  updatedAt: number;
  turns: Turn[];
}

const KEY = "ka-conversations-v1";
const MAX = 20;

function read(): SavedConversation[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedConversation[]) : [];
  } catch {
    return [];
  }
}

function write(items: SavedConversation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded or storage disabled: history simply isn't kept */
  }
}

/** Errors are class instances; keep only their plain fields so they survive JSON. */
function serialisable(turns: Turn[]): Turn[] {
  return turns.map((t) =>
    t.error ? { ...t, error: { status: t.error.status, code: t.error.code, message: t.error.message, requestId: t.error.requestId } as Turn["error"] } : t,
  );
}

export function useConversations() {
  const [items, setItems] = useState<SavedConversation[]>([]);
  useEffect(() => setItems(read()), []); // read after mount: no server/client mismatch

  const save = useCallback((c: SavedConversation) => {
    setItems((prev) => {
      const next = [{ ...c, turns: serialisable(c.turns) }, ...prev.filter((x) => x.id !== c.id)].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    write([]);
    setItems([]);
  }, []);

  return { items, save, remove, clear };
}
