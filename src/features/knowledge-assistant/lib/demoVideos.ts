import type { CorpusId, Domain } from "../api/types";

/**
 * Videos offered in the demo video selector. The backend has no video-list endpoint, so this is a
 * small, verified configuration (not a discovery service).
 *
 * V1: real video IDs from the frozen research corpus (data/comments_clean.csv), with their real
 *     indexed comment counts. V1 has NO domain labels (every row is "unlabeled").
 * V2: the SYNTHETIC test fixture (invented comments, fake video IDs) from the backend's
 *     tests/api/test_corpus_v2.py. Real Corpus V2 is not authorised for research use yet.
 */
export interface DemoVideo {
  corpus: CorpusId;
  videoId: string;
  domain: Domain | null;
  comments: number;
  label: string;
}

/** True while the only Corpus V2 we may load is the synthetic fixture. Flip when real V2 is authorised. */
export const V2_IS_SYNTHETIC = true;

export const DEMO_VIDEOS: DemoVideo[] = [
  // ---- Corpus V1 (real, unlabelled domain) ----
  { corpus: "v1", videoId: "-3a4abtQH3E", domain: null, comments: 129, label: "Wetakolu demo video" },
  { corpus: "v1", videoId: "7I-flYBQW3k", domain: null, comments: 485, label: "V1 video" },
  { corpus: "v1", videoId: "QL2J3Va-fJM", domain: null, comments: 471, label: "V1 video" },
  { corpus: "v1", videoId: "hhm3G63Qgrg", domain: null, comments: 467, label: "V1 video" },
  { corpus: "v1", videoId: "QvkLXe99zEk", domain: null, comments: 267, label: "V1 video" },
  // ---- Corpus V2 (SYNTHETIC fixture) ----
  { corpus: "v2", videoId: "vidFOOD0001", domain: "food", comments: 2, label: "Synthetic · kiri bath" },
  { corpus: "v2", videoId: "vidFOOD0002", domain: "food", comments: 3, label: "Synthetic · kottu" },
  { corpus: "v2", videoId: "vidGAME0001", domain: "gaming", comments: 2, label: "Synthetic · PUBG / Free Fire" },
  { corpus: "v2", videoId: "vidGAME0002", domain: "gaming", comments: 1, label: "Synthetic · GTA" },
  { corpus: "v2", videoId: "vidEDUC0001", domain: "education", comments: 2, label: "Synthetic · physics lesson" },
  { corpus: "v2", videoId: "vidEDUC0002", domain: "education", comments: 2, label: "Synthetic · ICT lesson" },
];

export function videosFor(corpus: CorpusId, domain: Domain | null): DemoVideo[] {
  return DEMO_VIDEOS.filter((v) => v.corpus === corpus && (domain === null || v.domain === domain));
}

export function findDemoVideo(videoId: string | null): DemoVideo | undefined {
  return videoId ? DEMO_VIDEOS.find((v) => v.videoId === videoId) : undefined;
}
