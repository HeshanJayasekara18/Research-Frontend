import { Icon } from "@/components/shell/Icon";
import { cn, ui } from "@/components/ui/styles";

import type { RetrievedComment } from "../api/types";
import { SCORE_LABEL } from "../lib/methods";

/** `synthetic`: result comes from the synthetic test fixture, so it gets a label and no (fake) YouTube link. */
export function EvidenceCard({ comment, maxScore, synthetic = false }: { comment: RetrievedComment; maxScore: number; synthetic?: boolean }) {
  // Bar shows score relative to the top result of THIS response only (scores are not comparable across methods).
  const pct = maxScore > 0 ? Math.max(4, Math.round((comment.score / maxScore) * 100)) : 0;
  return (
    <li className="grid grid-cols-[32px_minmax(0,1fr)] gap-3.5 border-t border-separator py-3.5 first:border-t-0 sm:grid-cols-[32px_minmax(0,1fr)_auto]">
      <div
        className="grid size-8 place-items-center rounded-full bg-tint-soft text-[0.85rem] font-bold text-tint"
        aria-label={`Rank ${comment.rank}`}
      >
        {comment.rank}
      </div>
      <div className="min-w-0">
        {/* Commenter identities are removed from the corpus for privacy. */}
        <p className="mb-2 mt-0 leading-[1.55] wrap-anywhere" lang="si">
          {comment.text}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {comment.likes !== null && (
            <span className="inline-flex items-center gap-1 text-[0.8rem] text-label-2">
              <Icon name="heart" size={14} /> {comment.likes.toLocaleString()}
            </span>
          )}
          <span className="inline-flex items-center gap-2" title={`${SCORE_LABEL[comment.score_type]}: ${comment.score}`}>
            <span className="h-1.5 w-[72px] overflow-hidden rounded-[3px] bg-fill" aria-hidden>
              <span className="block h-full rounded-[3px] bg-linear-to-r from-tint to-tint-2" style={{ width: `${pct}%` }} />
            </span>
            <span className={ui.caption}>
              {SCORE_LABEL[comment.score_type]} {comment.score.toFixed(comment.score_type === "rrf" ? 4 : 2)}
            </span>
          </span>
          {synthetic && <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[0.72rem] font-semibold text-warn">Synthetic</span>}
          {comment.domain && <span className={ui.caption}>{comment.domain}{comment.is_reply ? " · reply" : ""}</span>}
          {comment.views && <span className={ui.caption}>{comment.views.map((v) => `${v.view} #${v.rank}`).join(" · ")}</span>}
        </div>
      </div>
      {synthetic ? (
        <span className={cn(ui.caption, "col-start-2 self-start sm:col-start-auto")}>
          Video <code className="font-mono">{comment.video_id}</code> (synthetic, no link)
        </span>
      ) : comment.video_url && (
        <a
          className={
            "col-start-2 flex items-center gap-1.5 self-start rounded-[10px] bg-fill px-2.5 py-2 text-[0.8rem] text-label no-underline hover:bg-fill-strong " +
            "sm:col-start-auto sm:grid sm:justify-items-end sm:gap-0.5"
          }
          href={comment.video_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={ui.caption}>From video</span>
          <code className="font-mono text-[0.88em]">{comment.video_id}</code>
          <Icon name="external" size={14} label="Opens YouTube in a new tab" />
        </a>
      )}
    </li>
  );
}
