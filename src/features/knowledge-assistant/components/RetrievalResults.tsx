import type { RetrieveResponse, ScoreType } from "../api/types";
import { METHOD_LABELS } from "../api/types";
import styles from "./KnowledgeAssistant.module.css";

const SCORE_LABEL: Record<ScoreType, string> = {
  bm25: "BM25",
  char_tfidf_cosine: "TF-IDF cosine",
  labse_cosine: "LaBSE cosine",
  rrf: "RRF",
};

export function RetrievalResults({ response }: { response: RetrieveResponse }) {
  const { scope, normalization, results } = response;
  const where =
    scope.type === "video" ? (
      <>
        video <code>{scope.video_id}</code>
      </>
    ) : (
      "the global research corpus"
    );

  return (
    <section className={styles.results} aria-live="polite">
      <div className={styles.summary}>
        <span>
          <strong>{response.result_count}</strong> candidate comments from {where} ·{" "}
          {scope.documents_searched.toLocaleString()} searched · {METHOD_LABELS[response.method]}
        </span>
        {normalization && (
          <span className={styles.meta}>
            Normalisation: {normalization.status} ({Math.round(normalization.coverage * 100)}% coverage)
            {normalization.used ? ` → “${normalization.normalized_query}”` : " · not used"}
          </span>
        )}
      </div>

      <p className={styles.notice}>{response.notice}</p>

      {results.length === 0 ? (
        <div className={styles.empty}>
          <strong>No matching comments were retrieved.</strong> This does not mean no relevant comments exist. Lexical
          methods need shared words, and normalisation can fail. Try another method or rephrase the question.
        </div>
      ) : (
        <ol className={styles.list}>
          {results.map((r) => (
            <li key={r.document_id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.rank}>#{r.rank}</span>
                <span className={styles.meta}>
                  {SCORE_LABEL[r.score_type]} {r.score.toFixed(r.score_type === "rrf" ? 4 : 3)}
                  {r.likes !== null ? ` · ${r.likes} likes` : ""} · {r.document_id}
                </span>
              </div>
              <p className={styles.text} lang="si">
                {r.text}
              </p>
              <div className={styles.cardFoot}>
                {r.views && (
                  <span className={styles.meta}>
                    {r.views.map((v) => `${v.view} #${v.rank}`).join(" · ")}
                  </span>
                )}
                {r.video_url && (
                  <a href={r.video_url} target="_blank" rel="noopener noreferrer">
                    Open video
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className={styles.meta}>Request {response.request_id}</p>
    </section>
  );
}
