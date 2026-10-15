"use client";

import { useEffect } from "react";

import { Icon } from "@/components/shell/Icon";
import { cn } from "@/components/ui/styles";

import { timeAgo, type RecentSearch } from "../../hooks/useRecentSearches";
import type { SavedConversation } from "../../hooks/useConversations";

/**
 * Past chats (stored in this browser). Large screens: a collapsible right-hand column.
 * Smaller screens: a slide-over drawer with a backdrop (Esc or backdrop click closes it).
 */
export function HistoryPanel({
  open,
  onClose,
  items,
  activeId,
  onOpen,
  onDelete,
  onNewChat,
  recent,
  onRerun,
  onDeleteRecent,
  onClearAll,
}: {
  recent: RecentSearch[];
  onRerun: (r: RecentSearch) => void;
  onDeleteRecent: (id: string) => void;
  onClearAll: () => void;
  open: boolean;
  onClose: () => void;
  items: SavedConversation[];
  activeId: string | null;
  onOpen: (c: SavedConversation) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}) {
  // Esc closes the drawer on small screens.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && window.innerWidth < 1024 && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const entries = pastEntries(items, recent);

  return (
    <>
      {/* Backdrop: small screens only */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label="Past chats"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          // Drawer (< lg)
          "fixed inset-y-0 right-0 z-50 flex w-[min(86vw,320px)] flex-col border-l border-separator bg-surface shadow-soft transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-full",
          // Column (lg+): in the page flow, width animates between 0 and 280px
          "lg:static lg:z-auto lg:h-full lg:translate-x-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:shadow-none lg:transition-[width,opacity,margin]",
          open ? "lg:ml-4 lg:w-[280px] lg:opacity-100" : "lg:ml-0 lg:w-0 lg:border-0 lg:opacity-0",
        )}
      >
        <div className="flex min-w-[280px] flex-none items-center justify-between gap-2 border-b border-separator px-3 py-3">
          <h2 className="flex items-center gap-2 text-[0.92rem] font-semibold">
            <Icon name="history" size={16} /> Past chats
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNewChat}
              className="inline-flex min-h-8 items-center rounded-full border border-separator px-2.5 text-[0.78rem] font-medium hover:bg-fill"
            >
              + New
            </button>
            <button type="button" onClick={onClose} aria-label="Hide past chats" title="Hide" className="grid size-8 place-items-center rounded-full text-label-2 hover:bg-fill">
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        <div className="no-scrollbar min-h-0 min-w-[280px] flex-1 overflow-y-auto p-2">
          {entries.length === 0 ? (
            <p className="m-0 px-2 py-6 text-center text-[0.84rem] text-label-3">
              No past chats yet. Your questions are saved here in this browser.
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-0.5 p-0">
              {entries.map((e) => {
                const active = e.kind === "chat" && e.c.id === activeId;
                const title = e.kind === "chat" ? e.c.title : e.r.query;
                return (
                  <li key={e.key} className="group relative">
                    <button
                      type="button"
                      onClick={() => (e.kind === "chat" ? onOpen(e.c) : onRerun(e.r))}
                      aria-current={active || undefined}
                      title={e.kind === "search" ? "Run this question again" : undefined}
                      className={cn(
                        "grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 rounded-xl px-3 py-2 pr-9 text-left transition-colors",
                        active ? "bg-tint-soft" : "hover:bg-fill",
                      )}
                    >
                      <span className={cn("mt-0.5", active ? "text-tint" : "text-label-3")} aria-hidden>
                        <Icon name={e.kind === "chat" ? "chat" : "clock"} size={14} />
                      </span>
                      <span className={cn("truncate text-[0.86rem]", active ? "font-semibold text-tint" : "text-label")}>{title}</span>
                      <span className="col-start-2 text-[0.72rem] text-label-3">
                        {e.kind === "chat"
                          ? `${e.c.turns.length} ${e.c.turns.length === 1 ? "question" : "questions"}`
                          : "Earlier search · runs again"}{" "}
                        · {timeAgo(e.at)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => (e.kind === "chat" ? onDelete(e.c.id) : onDeleteRecent(e.r.id))}
                      aria-label={`Delete: ${title}`}
                      title="Delete"
                      className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-label-3 opacity-100 transition hover:bg-fill hover:text-danger lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex min-w-[280px] flex-none items-center justify-between border-t border-separator px-3 py-2 text-[0.7rem] text-label-3">
          <span>Stored only in this browser.</span>
          {entries.length > 0 && (
            <button type="button" onClick={onClearAll} className="rounded px-1 text-[0.72rem] hover:text-danger">
              Clear all
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * One list: saved chats (reopen with their results) + earlier searches that aren't part of a
 * saved chat (e.g. made before chats were saved; clicking runs them again). Newest first.
 */
export function pastEntries(items: SavedConversation[], recent: RecentSearch[]) {
  const inChats = new Set(items.flatMap((c) => c.turns.map((t) => `${t.query}|${t.scope.videoId ?? ""}`)));
  return [
    ...items.map((c) => ({ kind: "chat" as const, key: c.id, at: c.updatedAt, c })),
    ...recent
      .filter((r) => !inChats.has(`${r.query}|${r.videoId ?? ""}`))
      .map((r) => ({ kind: "search" as const, key: r.id, at: r.at, r })),
  ].sort((a, b) => b.at - a.at);
}

/** Small toggle shown in the chat header / welcome screen. */
export function HistoryToggle({ open, onToggle, count }: { open: boolean; onToggle: () => void; count: number }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Hide past chats" : "Show past chats"}
      title={open ? "Hide past chats" : "Show past chats"}
      className={cn(
        "relative inline-flex min-h-9 flex-none items-center gap-1.5 rounded-full border border-separator px-2.5 text-[0.82rem] font-medium transition-colors",
        open ? "bg-tint-soft text-tint" : "bg-surface hover:bg-fill",
      )}
    >
      <Icon name="history" size={16} />
      <span className="max-sm:sr-only">History</span>
      {count > 0 && !open && <span className="rounded-full bg-fill-strong px-1.5 text-[0.68rem] tabular-nums">{count}</span>}
    </button>
  );
}
