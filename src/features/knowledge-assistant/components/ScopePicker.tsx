"use client";

import { useId } from "react";

import { Icon } from "@/components/shell/Icon";
import { cn, ui } from "@/components/ui/styles";

import { VIDEO_ID_RE } from "../api/validate";

export interface Scope {
  mode: "video" | "all";
  videoId: string;
}

/** Accepts a video ID or a full YouTube URL and returns the ID. */
export function extractVideoId(input: string): string {
  const v = input.trim();
  const m = v.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,64})/);
  return m ? m[1] : v;
}

export function scopeError(scope: Scope): string | null {
  if (scope.mode === "all") return null;
  const id = extractVideoId(scope.videoId);
  if (!id) return "Enter a video ID or YouTube link.";
  return VIDEO_ID_RE.test(id) ? null : "That doesn't look like a YouTube video ID.";
}

export function ScopePicker({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const id = useId();
  const err = value.videoId ? scopeError(value) : null;

  return (
    <div className="grid min-w-0 gap-1.5">
      <span className={ui.field} id={`${id}-label`}>
        Select scope
      </span>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className={ui.segmented} role="group" aria-labelledby={`${id}-label`}>
          <button type="button" className={ui.segment} aria-pressed={value.mode === "video"} onClick={() => onChange({ ...value, mode: "video" })}>
            One video
          </button>
          <button type="button" className={ui.segment} aria-pressed={value.mode === "all"} onClick={() => onChange({ ...value, mode: "all" })}>
            All videos
          </button>
        </div>
        {value.mode === "video" ? (
          <div className="min-w-0 flex-[1_1_200px]">
            <label htmlFor={`${id}-video`} className="sr-only">
              Video ID or YouTube link
            </label>
            <input
              id={`${id}-video`}
              className={ui.input}
              value={value.videoId}
              onChange={(e) => onChange({ ...value, videoId: e.target.value })}
              placeholder="Video ID or YouTube link"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={Boolean(err)}
              aria-describedby={err ? `${id}-err` : undefined}
            />
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[0.85rem] text-label-2">
            <Icon name="globe" size={16} /> Research corpus
          </span>
        )}
      </div>
      {err && (
        <span id={`${id}-err`} className={cn("text-[0.78rem] text-danger")}>
          {err}
        </span>
      )}
    </div>
  );
}
