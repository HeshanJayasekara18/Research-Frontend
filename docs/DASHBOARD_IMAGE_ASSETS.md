# Dashboard image assets

Place files in `public/images/dashboard/` (`.webp` preferred; `.png`, `.jpg` or `.jpeg` with the same name also work). Until a file exists the dashboard shows a designed gradient + icon placeholder (never a broken image). Paths are configured in `src/features/dashboard/lib/assets.ts`.

| File | Used in | Size (px) | Ratio | Description |
|---|---|---|---|---|
| `creator-hero.webp` | Hero banner, right half | 1200 × 800 | 3:2 | Sri Lankan creator at a desk/studio planning content (camera, laptop, ring light). Darker tones so it sits well on the dark theme; subject on the right, calm space on the left. |
| `market-research.webp` | "Explore your creator tools" card 1 | 800 × 600 | 4:3 | Abstract trend/discovery visual: rising charts, topic bubbles, search. Warm coral accents. |
| `video-prediction.webp` | Card 2 | 800 × 600 | 4:3 | Video thumbnail/timeline with a forecast curve; suggests estimation, not certainty. Violet accents. |
| `knowledge-assistant.webp` | Card 3 | 800 × 600 | 4:3 | Optional. If absent, the existing `youbeyotube.png` mascot is used (already present). |
| `analytics.webp` | Card 4 | 800 × 600 | 4:3 | Clean dashboard/engagement chart illustration. Teal accents. |

Guidelines: WebP, under ~200 KB each, no text baked into images, no third-party logos or stock photos without a licence. `next/image` serves resized copies automatically.

Note: the home page is statically rendered, so after adding images in production run `npm run build` again (in `npm run dev` they appear on refresh).
