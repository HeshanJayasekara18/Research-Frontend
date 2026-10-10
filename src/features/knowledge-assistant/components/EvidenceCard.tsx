import { Icon } from "@/components/shell/Icon";

import type { RetrievedComment } from "../api/types";
import { SCORE_LABEL } from "../lib/methods";
import styles from "./evidence.module.css";

export function EvidenceCard({ comment, maxScore }: { comment: RetrievedComment; maxScore: number }) {
  // Bar shows score relative to the top result of THIS response only (scores are not comparable across methods).
  const pct = maxScore > 0 ? Math.max(4, Math.round((comment.score / maxScore) * 100)) : 0;
  return (
    <li className={styles.card}>
      <div className={styles.rank} aria-label={`Rank ${comment.rank}`}>
        {comment.rank}
      </div>
      <div className={styles.body}>
        {/* Commenter identities are removed from the corpus for privacy. */}
        <p className={styles.text} lang="si">
          {comment.text}
        </p>
        <div className={styles.meta}>
          {comment.likes !== null && (
            <span className={styles.likes}>
              <Icon name="heart" size={14} /> {comment.likes.toLocaleString()}
            </span>
          )}
          <span className={styles.score} title={`${SCORE_LABEL[comment.score_type]}: ${comment.score}`}>
            <span className={styles.bar} aria-hidden>
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className="caption">
              {SCORE_LABEL[comment.score_type]} {comment.score.toFixed(comment.score_type === "rrf" ? 4 : 2)}
            </span>
          </span>
          {comment.views && (
            <span className="caption">
              {comment.views.map((v) => `${v.view} #${v.rank}`).join(" · ")}
            </span>
          )}
        </div>
      </div>
      {comment.video_url && (
        <a className={styles.video} href={comment.video_url} target="_blank" rel="noopener noreferrer">
          <span className="caption">From video</span>
          <code>{comment.video_id}</code>
          <Icon name="external" size={14} label="Opens YouTube in a new tab" />
        </a>
      )}
    </li>
  );
}
