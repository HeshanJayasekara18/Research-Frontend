"use client";

import { LayoutGroup, motion, MotionConfig } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Icon } from "@/components/shell/Icon";
import { cn } from "@/components/ui/styles";

import type { CorpusId } from "../api/types";
import { useConversations, type SavedConversation } from "../hooks/useConversations";
import { useHealth } from "../hooks/useHealth";
import { useRecentSearches, type RecentSearch } from "../hooks/useRecentSearches";
import { findDemoVideo } from "../lib/demoVideos";
import { defaultMethod, METHODS } from "../lib/methods";
import { BOT_NAME, BotOrb } from "./BotOrb";
import { ChatComposer, type ComposerHandle, type ControlsState } from "./chat/ChatComposer";
import { HistoryPanel, HistoryToggle, pastEntries } from "./chat/HistoryPanel";
import { AssistantMessage, UserMessage } from "./chat/Messages";
import type { Turn } from "./chat/model";
import { useChat } from "./chat/useChat";
import { ServiceStatus } from "./ServiceStatus";

// Shared layout transition for the mascot and composer (welcome -> chat).
// MotionConfig reducedMotion="user" turns these into instant changes for reduced-motion users.
const SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as const;

// Fill the space below the app's top bar (48px) minus <main> padding:
// desktop py-6 (48px) -> 96px; mobile pt-5 + pb-[104px] (bottom tab bar) -> 172px.
const HISTORY_OPEN_KEY = "ka-history-open";

const FULL_HEIGHT = "h-[calc(100dvh-172px)] md:h-[calc(100dvh-96px)]";

const SUGGESTIONS = [
  "Viewers la ahana prashna monawada?",
  "Viewers la kamathi monawa gena da?",
  "Ilanga video eka monawa gena karanna kiyala viewers la kiyanne?",
];

/** Knowledge Assistant: centred welcome screen that becomes a conversation after the first message. */
export function AssistantWorkspace() {
  const health = useHealth();
  const recent = useRecentSearches();

  const [draft, setDraft] = useState("");
  const [controls, setControls] = useState<ControlsState>({ corpus: "v1", domain: "", videoId: "", method: "bm25" });
  const methodTouched = useRef(false);
  const composer = useRef<ComposerHandle>(null);

  const corpora = health.health?.corpora ?? null;
  const semanticFor = (c: CorpusId) => (corpora?.[c] ? corpora[c].semantic_index_present : c === "v1" && health.semanticReady);
  const llmEnabled = Boolean(health.health?.llm?.enabled);

  // Default method once we know whether meaning search exists (unless the user already chose).
  useEffect(() => {
    if (!methodTouched.current && health.health) setControls((c) => ({ ...c, method: defaultMethod(health.semanticReady) }));
  }, [health.health, health.semanticReady]);

  const addRecent = recent.add;
  const onSearched = useCallback(
    (t: Turn) => addRecent({ query: t.query, videoId: t.scope.videoId, method: t.method }),
    [addRecent],
  );
  const chat = useChat({ llmEnabled, onSearched });
  const started = chat.turns.length > 0;

  // ---- Past chats (saved in this browser) ----
  const history = useConversations();
  const [convId, setConvId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Panel starts open on large screens (or as last chosen), closed on small screens.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(HISTORY_OPEN_KEY);
    } catch {
      /* ignore */
    }
    setHistoryOpen(window.matchMedia("(min-width: 1024px)").matches && stored !== "false");
  }, []);

  function toggleHistory(next = !historyOpen) {
    setHistoryOpen(next);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      try {
        localStorage.setItem(HISTORY_OPEN_KEY, String(next));
      } catch {
        /* ignore */
      }
    }
  }
  const closeOnSmall = () => !window.matchMedia("(min-width: 1024px)").matches && setHistoryOpen(false);

  // Save the conversation whenever a turn finishes.
  const saveConversation = history.save;
  useEffect(() => {
    if (chat.busy || chat.turns.length === 0) return;
    const id = convId ?? crypto.randomUUID();
    if (!convId) setConvId(id);
    saveConversation({ id, title: chat.turns[0].query, updatedAt: Date.now(), turns: chat.turns });
  }, [chat.turns, chat.busy, convId, saveConversation]);

  const pastCount = pastEntries(history.items, recent.items).length;

  function openConversation(c: SavedConversation) {
    setConvId(c.id);
    chat.load(c.turns);
    setDraft("");
    closeOnSmall();
  }

  function deleteConversation(id: string) {
    history.remove(id);
    if (id === convId) newChat();
  }

  // The composer remounts in its new position when the view switches; keep keyboard focus in it.
  useEffect(() => {
    if (started) composer.current?.focus();
  }, [started]);

  function updateControls(p: Partial<ControlsState>) {
    if (p.method) methodTouched.current = true;
    setControls((c) => {
      const next = { ...c, ...p };
      // Drop a semantic method if the newly chosen corpus has no LaBSE index.
      if (p.corpus && METHODS[next.method].semantic && !semanticFor(p.corpus)) next.method = "bm25";
      return next;
    });
  }

  function send(text = draft) {
    if (!text.trim() || chat.busy) return;
    chat.send(text, { corpus: controls.corpus, domain: controls.domain || null, videoId: controls.videoId || null }, controls.method);
    setDraft("");
  }

  function reopen(r: RecentSearch) {
    const demo = findDemoVideo(r.videoId);
    methodTouched.current = true;
    const c: ControlsState = { corpus: demo?.corpus ?? "v1", domain: "", videoId: demo?.videoId ?? "", method: r.method };
    setControls(c);
    setConvId(null);
    chat.reset();
    chat.send(r.query, { corpus: c.corpus, domain: null, videoId: c.videoId || null }, c.method);
    closeOnSmall();
  }

  function newChat() {
    chat.reset();
    setConvId(null);
    closeOnSmall();
    setDraft("");
    requestAnimationFrame(() => composer.current?.focus());
  }

  const composerEl = (
    <ChatComposer
      ref={composer}
      value={draft}
      onChange={setDraft}
      onSend={() => send()}
      busy={chat.busy}
      controls={controls}
      onControls={updateControls}
      v2Available={Boolean(corpora?.v2)}
      domainCounts={corpora?.[controls.corpus]?.domains ?? null}
      semanticAvailable={semanticFor(controls.corpus)}
      placeholder={started ? "Ask a follow-up question…" : undefined}
    />
  );

  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      <LayoutGroup>
        <div className={cn("flex w-full", FULL_HEIGHT)}>
          <div className="mx-auto flex min-w-0 max-w-[880px] flex-1 flex-col">
            {started ? (
              <ChatView
                turns={chat.turns}
                onRetry={chat.retry}
                onNewChat={newChat}
                busy={chat.busy}
                composer={composerEl}
                historyToggle={<HistoryToggle open={historyOpen} onToggle={() => toggleHistory()} count={pastCount} />}
              />
            ) : (
              <WelcomeView
                health={<ServiceStatus state={health} />}
                historyToggle={<HistoryToggle open={historyOpen} onToggle={() => toggleHistory()} count={pastCount} />}
                composer={composerEl}
                onSuggestion={(q) => {
                  setDraft(q);
                  composer.current?.focus();
                }}
              />
            )}
          </div>
          <HistoryPanel
            open={historyOpen}
            onClose={() => toggleHistory(false)}
            items={history.items}
            activeId={convId}
            onOpen={openConversation}
            onDelete={deleteConversation}
            onNewChat={newChat}
            recent={recent.items}
            onRerun={reopen}
            onDeleteRecent={recent.remove}
            onClearAll={() => {
              history.clear();
              recent.clear();
              if (started) newChat();
            }}
          />
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}

/* ---------------- Welcome state ---------------- */

function WelcomeView({
  health,
  historyToggle,
  composer,
  onSuggestion,
}: {
  health: React.ReactNode;
  historyToggle: React.ReactNode;
  composer: React.ReactNode;
  onSuggestion: (q: string) => void;
}) {
  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto py-2 sm:gap-6">
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        {health}
        {historyToggle}
      </div>
      <div className="my-auto flex w-full flex-col items-center gap-5 sm:gap-6">

        <div className="flex flex-col items-center text-center">
          <motion.div layoutId="youbeyo-mascot" className="mb-5 size-[clamp(112px,16vh,168px)]">
            <BotOrb size="100%" priority />
          </motion.div>
          <h1 className="text-[clamp(1.6rem,3vw,2.3rem)] font-bold tracking-[-0.025em]">What would you like to know?</h1>
          <p className="mb-0 mt-2 text-label-2">Ask about your audience comments in Singlish, Sinhala or English.</p>
        </div>

        <motion.div layoutId="chat-composer" layout="position" className="w-full">
          {composer}
        </motion.div>

        <div className="flex w-full flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSuggestion(q)}
              className="max-w-full truncate rounded-full border border-separator bg-surface px-3 py-1.5 text-[0.8rem] text-label-2 transition-colors hover:border-tint/40 hover:text-label"
            >
              {q}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ---------------- Chat state ---------------- */

function ChatView({
  turns,
  onRetry,
  onNewChat,
  busy,
  composer,
  historyToggle,
}: {
  historyToggle: React.ReactNode;
  turns: Turn[];
  onRetry: (id: string) => void;
  onNewChat: () => void;
  busy: boolean;
  composer: React.ReactNode;
}) {
  const list = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const prevCount = useRef(0);

  const scrollToBottom = (smooth = true) => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });

  // New user message -> always follow it (and keep following). Response updates -> only if the reader is
  // near the bottom. Programmatic scrolls are instant: a smooth scroll emits intermediate scroll events
  // that would wrongly mark the reader as "scrolled up".
  useLayoutEffect(() => {
    const added = turns.length > prevCount.current;
    prevCount.current = turns.length;
    if (added) nearBottom.current = true;
    if (nearBottom.current) scrollToBottom(false);
  }, [turns]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header: title + New chat on the left, small persistent mascot on the right. */}
      <header className="flex flex-none items-center gap-2 border-b border-separator pb-3 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[0.92rem] font-semibold sm:text-[0.98rem]">{turns[0]?.query}</h1>
          <span className="text-[0.76rem] text-label-3">
            {turns.length} {turns.length === 1 ? "question" : "questions"} · {BOT_NAME}
          </span>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          className="inline-flex min-h-9 flex-none items-center gap-1.5 rounded-full border border-separator bg-surface px-3 text-[0.82rem] font-medium hover:bg-fill"
        >
          +<span className="max-sm:sr-only"> New chat</span>
        </button>
        {historyToggle}
        <motion.div layoutId="youbeyo-mascot" className="size-10 flex-none sm:size-11">
          <BotOrb size="100%" thinking={busy} />
        </motion.div>
      </header>

      {/* Timeline: the only scrolling region. */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={list}
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          onScroll={(e) => {
            const el = e.currentTarget;
            const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            nearBottom.current = near;
            setShowJump(!near);
          }}
          className="no-scrollbar h-full overflow-y-auto overscroll-contain py-4 sm:py-5"
        >
          <ol className="m-0 grid list-none gap-6 p-0 pr-1">
            {turns.map((t) => (
              <li key={t.id} className="grid gap-4">
                <UserMessage turn={t} />
                <AssistantMessage turn={t} onRetry={onRetry} />
              </li>
            ))}
          </ol>
        </div>
        {showJump && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-separator bg-surface-raised px-3 py-1.5 text-[0.8rem] shadow-soft hover:bg-fill"
          >
            <span className="rotate-90">
              <Icon name="arrow" size={14} />
            </span>
            Scroll to latest
          </button>
        )}
      </div>

      {/* Composer: pinned below the timeline. */}
      <motion.div layoutId="chat-composer" layout="position" className="flex-none border-t border-separator pt-3">
        {composer}
      </motion.div>
    </div>
  );
}
