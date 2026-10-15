// Mirrors the C3 backend v1 contract (backend repo: docs/openapi.json).
// Breaking changes there require /v2, so these types are stable within v1.

export const RETRIEVAL_METHODS = [
  "bm25",
  "char_tfidf",
  "labse",
  "normalized_bm25",
  "normalized_labse",
  "multiview_bm25",
  "multiview_labse",
  "multiview_hybrid",
] as const;

export type RetrievalMethod = (typeof RETRIEVAL_METHODS)[number];

export const METHOD_LABELS: Record<RetrievalMethod, string> = {
  bm25: "BM25 (lexical)",
  char_tfidf: "Character TF-IDF",
  labse: "LaBSE (semantic)",
  normalized_bm25: "Normalized query → BM25 (experimental)",
  normalized_labse: "Normalized query → LaBSE (experimental)",
  multiview_bm25: "Multi-view RRF: BM25 (experimental)",
  multiview_labse: "Multi-view RRF: LaBSE (experimental)",
  multiview_hybrid: "Multi-view RRF: BM25 + LaBSE (experimental)",
};

export const QUERY_MAX_CHARS = 1000;
export const TOP_K_MIN = 1;
export const TOP_K_MAX = 50;

export const CORPORA = ["v1", "v2"] as const;
export type CorpusId = (typeof CORPORA)[number];
export const DOMAINS = ["food", "gaming", "education"] as const;
export type Domain = (typeof DOMAINS)[number];

export interface RetrieveScope {
  corpus?: CorpusId;
  domain?: Domain | null;
  video_id: string | null;
}

export interface RetrieveRequest {
  query: string;
  method?: RetrievalMethod;
  top_k?: number;
  scope?: RetrieveScope;
}

export type ScoreType = "bm25" | "char_tfidf_cosine" | "labse_cosine" | "rrf";

export interface ViewContribution {
  view: string;
  rank: number;
  score: number;
}

export interface RetrievedComment {
  rank: number;
  document_id: string;
  video_id: string;
  text: string;
  likes: number | null;
  video_url: string | null;
  score: number;
  score_type: ScoreType;
  views: ViewContribution[] | null;
  // Corpus V2 metadata (null for V1)
  comment_id?: string | null;
  domain?: string | null;
  is_reply?: boolean | null;
}

export interface NormalizationInfo {
  status: string;
  normalized_query: string;
  coverage: number;
  used: boolean;
}

export interface RetrieveResponse {
  request_id: string;
  query: string;
  method: RetrievalMethod;
  top_k: number;
  scope: {
    type: "video" | "global" | "domain";
    video_id: string | null;
    corpus?: string;
    domain?: string | null;
    documents_searched: number;
    ownership_verified: false;
  };
  normalization: NormalizationInfo | null;
  results: RetrievedComment[];
  result_count: number;
  notice: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  version: string;
  api_version: string;
  engine_ready: boolean;
  corpus_documents: number;
  videos: number;
  semantic: { index_present: boolean; loaded: boolean };
  auth_enabled: boolean;
  llm?: { provider: string; model: string; enabled: boolean } | null;
  corpora?: Record<string, CorpusSummary> | null;
}

export interface CorpusSummary {
  documents: number;
  videos: number;
  domains: Record<string, number> | null;
  semantic_index_present: boolean;
}

/* ---------- POST /v1/ask (evidence-grounded Sinhala answer) ---------- */

export interface AskRequest {
  query: string;
  scope: { corpus?: CorpusId; video_id: string };
  method?: RetrievalMethod;
}

export interface EvidenceItem {
  label: string;
  document_id: string;
  video_id: string;
  comment_text: string;
  retrieval_rank: number;
  matched_terms: string[];
  video_reference: { url: string | null; granularity: "video" };
}

export interface AskResponse {
  request_id: string;
  query: string;
  status: "answered" | "insufficient_evidence";
  answer: string | null;
  insufficient_reason: "no_content_term_match" | "model_declined" | null;
  citations: EvidenceItem[];
  evidence_supplied: EvidenceItem[];
  retrieval: { method: RetrievalMethod; candidates_retrieved: number; candidates_selected: number };
  generation: { provider: string; model: string; called: boolean };
  notice: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: { loc?: (string | number)[]; msg?: string; type?: string }[];
  };
}
