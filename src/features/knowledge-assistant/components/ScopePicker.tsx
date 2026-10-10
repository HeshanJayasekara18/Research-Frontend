"use client";

import { useId } from "react";

import { Icon } from "@/components/shell/Icon";

import { VIDEO_ID_RE } from "../api/validate";
import styles from "./controls.module.css";

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
    <div className={styles.group}>
      <span className="field" id={`${id}-label`}>
        Select scope
      </span>
      <div className={styles.scopeRow}>
        <div className="segmented" role="group" aria-labelledby={`${id}-label`}>
          <button type="button" aria-pressed={value.mode === "video"} onClick={() => onChange({ ...value, mode: "video" })}>
            One video
          </button>
          <button type="button" aria-pressed={value.mode === "all"} onClick={() => onChange({ ...value, mode: "all" })}>
            All videos
          </button>
        </div>
        {value.mode === "video" ? (
          <div className={styles.grow}>
            <label htmlFor={`${id}-video`} className="sr-only">
              Video ID or YouTube link
            </label>
            <input
              id={`${id}-video`}
              className="input"
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
          <span className={styles.scopeNote}>
            <Icon name="globe" size={16} /> Research corpus
          </span>
        )}
      </div>
      {err && (
        <span id={`${id}-err`} className={styles.error}>
          {err}
        </span>
      )}
    </div>
  );
}
