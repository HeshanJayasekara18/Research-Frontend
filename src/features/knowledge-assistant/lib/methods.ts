import type { RetrievalMethod, ScoreType } from "../api/types";

export interface MethodInfo {
  label: string;
  short: string;
  description: string;
  semantic: boolean; // needs the LaBSE index on the server
  experimental: boolean;
}

// Plain-language descriptions for creators. "Experimental" = not yet validated on
// human relevance labels; we never label a method "best" or "recommended".
export const METHODS: Record<RetrievalMethod, MethodInfo> = {
  bm25: { label: "Keyword match", short: "BM25", description: "Finds comments that share your exact words.", semantic: false, experimental: false },
  char_tfidf: { label: "Spelling-tolerant", short: "Char TF-IDF", description: "Matches parts of words, so spelling variations still match.", semantic: false, experimental: false },
  labse: { label: "Meaning match", short: "LaBSE", description: "Finds comments with similar meaning across Sinhala, Singlish and English.", semantic: true, experimental: false },
  normalized_bm25: { label: "Sinhala-normalised keywords", short: "Normalized BM25", description: "Converts Singlish to Sinhala script, then matches keywords.", semantic: false, experimental: true },
  normalized_labse: { label: "Sinhala-normalised meaning", short: "Normalized LaBSE", description: "Converts Singlish to Sinhala script, then matches meaning.", semantic: true, experimental: true },
  multiview_bm25: { label: "Multi-view keywords", short: "Multi-view BM25", description: "Combines keyword results for the original and normalised question (RRF).", semantic: false, experimental: true },
  multiview_labse: { label: "Multi-view meaning", short: "Multi-view LaBSE", description: "Combines meaning results for the original and normalised question (RRF).", semantic: true, experimental: true },
  multiview_hybrid: { label: "Multi-view hybrid", short: "Multi-view RRF", description: "Combines keyword and meaning results for both question forms (RRF).", semantic: true, experimental: true },
};

export const METHOD_ORDER: RetrievalMethod[] = [
  "multiview_hybrid",
  "bm25",
  "labse",
  "char_tfidf",
  "normalized_bm25",
  "normalized_labse",
  "multiview_bm25",
  "multiview_labse",
];

/** Default comparison set, mirroring the research write-up. */
export const COMPARE_DEFAULT: RetrievalMethod[] = ["bm25", "normalized_bm25", "labse", "multiview_hybrid"];

export function defaultMethod(semanticReady: boolean): RetrievalMethod {
  return semanticReady ? "multiview_hybrid" : "bm25";
}

export const SCORE_LABEL: Record<ScoreType, string> = {
  bm25: "BM25 score",
  char_tfidf_cosine: "TF-IDF cosine",
  labse_cosine: "Cosine similarity",
  rrf: "RRF score",
};
