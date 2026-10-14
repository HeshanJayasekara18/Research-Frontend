import "server-only";

import fs from "node:fs";
import path from "node:path";

// Dashboard image slots. Files are supplied by the team (see docs/DASHBOARD_IMAGE_ASSETS.md).
// Each slot lists candidates in priority order; the first that exists in /public is used.
// If none exists the UI renders a designed placeholder instead of a broken image.
export const DASHBOARD_ASSETS = {
  hero: ["/images/dashboard/creator-hero.webp", "/images/dashboard/creator-hero.png", "/images/dashboard/creator-hero.jpg", "/images/dashboard/creator-hero.jpeg"],
  marketResearch: ["/images/dashboard/market-research.webp", "/images/dashboard/market-research.png", "/images/dashboard/market-research.jpg", "/images/dashboard/market-research.jpeg"],
  videoPrediction: ["/images/dashboard/video-prediction.webp", "/images/dashboard/video-prediction.png", "/images/dashboard/video-prediction.jpg", "/images/dashboard/video-prediction.jpeg"],
  knowledgeAssistant: ["/images/dashboard/knowledge-assistant.webp", "/images/dashboard/knowledge-assistant.png", "/images/dashboard/knowledge-assistant.jpg", "/images/dashboard/knowledge-assistant.jpeg", "/images/youbeyotube.png"],
  analytics: ["/images/dashboard/analytics.webp", "/images/dashboard/analytics.png", "/images/dashboard/analytics.jpg", "/images/dashboard/analytics.jpeg"],
} as const;

export type AssetSlot = keyof typeof DASHBOARD_ASSETS;
export type ResolvedAssets = Record<AssetSlot, string | null>;

/** Resolved on the server at render time, so no client request ever hits a missing file. */
export function resolveDashboardAssets(): ResolvedAssets {
  const pub = path.join(process.cwd(), "public");
  const out = {} as ResolvedAssets;
  for (const [slot, candidates] of Object.entries(DASHBOARD_ASSETS) as [AssetSlot, readonly string[]][]) {
    out[slot] = candidates.find((c) => fs.existsSync(path.join(pub, c))) ?? null;
  }
  return out;
}
