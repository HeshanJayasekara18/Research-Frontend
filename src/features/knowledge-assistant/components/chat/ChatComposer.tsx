"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react";

import { Icon } from "@/components/shell/Icon";
import { cn } from "@/components/ui/styles";

import { DOMAINS, QUERY_MAX_CHARS, type CorpusId, type Domain, type RetrievalMethod } from "../../api/types";
import { V2_IS_SYNTHETIC, videosFor } from "../../lib/demoVideos";
import { METHOD_ORDER, METHODS } from "../../lib/methods";

export interface ControlsState {
  corpus: CorpusId;
  domain: Domain | "";
  videoId: string;
  method: RetrievalMethod;
}

export interface ComposerHandle {
  focus: () => void;
}

const CHIP =
  "inline-flex min-h-8 min-w-0 flex-none items-center gap-1.5 rounded-full border border-separator bg-surface px-2.5 text-[0.78rem] text-label-2 " +
  "focus-within:border-tint/50 hover:border-tint/40";
const SELECT = "min-w-0 max-w-full truncate border-0 bg-transparent text-[0.78rem] text-label outline-none disabled:opacity-60 [&_option]:bg-surface [&_option]:text-label";

/** Compact scope controls + auto-resizing textarea. Enter sends, Shift+Enter adds a new line. */
export const ChatComposer = forwardRef<
  ComposerHandle,
  {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    busy: boolean;
    controls: ControlsState;
    onControls: (c: Partial<ControlsState>) => void;
    v2Available: boolean;
    domainCounts: Record<string, number> | null;
    semanticAvailable: boolean;
    placeholder?: string;
  }
>(function ChatComposer(
  { value, onChange, onSend, busy, controls, onControls, v2Available, domainCounts, semanticAvailable, placeholder },
  ref,
) {
  const ids = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }), []);

  // Auto-resize (capped; scrolls inside beyond the cap).
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const methodOff = (m: RetrievalMethod) => METHODS[m].semantic && !semanticAvailable;
  const canSend = value.trim().length > 0 && !busy && !methodOff(controls.method);
  const synthetic = controls.corpus === "v2" && V2_IS_SYNTHETIC;

  return (
    <form
      className="glow-border w-full rounded-[22px] border border-tint/30 bg-tint-soft p-1 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
      aria-busy={busy}
    >
      {/* Scope controls */}
      {/* One swipeable row on phones; wraps on wider screens. */}
      <div className="flex items-center gap-1.5 no-scrollbar overflow-x-auto px-2 pb-1.5 pt-1 sm:flex-wrap sm:overflow-visible">
        <label className={CHIP} title="Corpus">
          <Icon name="globe" size={13} />
          <span className="sr-only">Corpus</span>
          <select
            className={SELECT}
            value={controls.corpus}
            onChange={(e) => onControls({ corpus: e.target.value as CorpusId, domain: "", videoId: "" })}
          >
            <option value="v1">Corpus V1 (real)</option>
            <option value="v2" disabled={!v2Available}>
              Corpus V2{V2_IS_SYNTHETIC ? " (synthetic)" : ""}
              {v2Available ? "" : " (not loaded)"}
            </option>
          </select>
        </label>

        <label className={CHIP} title={controls.corpus === "v1" ? "Corpus V1 has no domain labels" : "Domain"}>
          <Icon name="sparkle" size={13} />
          <span className="sr-only">Domain</span>
          <select
            className={SELECT}
            value={controls.domain}
            disabled={controls.corpus === "v1"}
            onChange={(e) => onControls({ domain: e.target.value as Domain | "", videoId: "" })}
          >
            <option value="">{controls.corpus === "v1" ? "No domain labels" : "All domains"}</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d} disabled={!domainCounts?.[d]}>
                {d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className={cn(CHIP, "max-w-[230px] sm:max-w-full sm:flex-[1_1_180px]")} title="Video">
          <Icon name="video" size={13} />
          <span className="sr-only">Video</span>
          <select className={cn(SELECT, "flex-1")} value={controls.videoId} onChange={(e) => onControls({ videoId: e.target.value })}>
            <option value="">All videos{controls.domain ? ` in ${controls.domain}` : ""}</option>
            {videosFor(controls.corpus, controls.domain || null).map((v) => (
              <option key={v.videoId} value={v.videoId}>
                {v.label} · {v.videoId} ({v.comments})
              </option>
            ))}
          </select>
        </label>

        <label className={CHIP} title={METHODS[controls.method].description}>
          <Icon name="chart" size={13} />
          <span className="sr-only">Retrieval method</span>
          <select className={SELECT} value={controls.method} onChange={(e) => onControls({ method: e.target.value as RetrievalMethod })}>
            {METHOD_ORDER.map((m) => (
              <option key={m} value={m} disabled={methodOff(m)}>
                {METHODS[m].short}
                {METHODS[m].experimental ? " (exp.)" : ""}
                {methodOff(m) ? " (unavailable)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 rounded-[18px] border border-separator bg-surface py-2 pl-3.5 pr-2">
        <label htmlFor={`${ids}-q`} className="sr-only">
          Your question
        </label>
        <textarea
          id={`${ids}-q`}
          ref={area}
          rows={1}
          value={value}
          maxLength={QUERY_MAX_CHARS}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={placeholder ?? "Ask about your audience comments…"}
          className="max-h-[200px] min-h-[28px] flex-1 resize-none self-center border-0 bg-transparent py-1 text-base leading-relaxed text-label outline-none placeholder:text-label-3"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={busy ? "Waiting for the response" : "Send"}
          title={methodOff(controls.method) ? "This method isn't available for this corpus" : busy ? "Waiting for the response" : "Send (Enter)"}
          className={
            "grid size-9 flex-none place-items-center rounded-full bg-tint text-white transition active:scale-95 " +
            "disabled:cursor-not-allowed disabled:opacity-40"
          }
        >
          {busy ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          ) : (
            <span className="-rotate-90">
              <Icon name="arrow" size={17} />
            </span>
          )}
        </button>
      </div>

      {synthetic && (
        <p className="m-0 px-3 pb-1 pt-1.5 text-[0.74rem] font-medium text-warn">
          Synthetic test data: Corpus V2 here is an invented fixture, not real YouTube comments.
        </p>
      )}
    </form>
  );
});
