// Shared Tailwind class strings for recurring UI primitives (cards, buttons, pills, fields).

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const ui = {
  page: "mx-auto grid max-w-[1180px] gap-6",
  pageTitle: "text-[1.75rem] font-bold",
  pageSubtitle: "mt-1 text-label-2",
  card: "rounded-[20px] border border-separator bg-surface p-5 shadow-soft",
  sectionTitle: "text-[1.05rem] font-semibold",
  muted: "text-label-2",
  caption: "text-[0.78rem] text-label-3",
  field: "grid gap-1.5 text-[0.82rem] font-semibold text-label-2",
  input:
    "min-h-10 w-full rounded-[10px] border border-separator bg-surface px-3 py-2 font-normal text-label " +
    "focus:border-tint focus:outline-none focus:ring-[3px] focus:ring-tint-soft aria-[invalid=true]:border-danger",
  btn:
    "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-4 font-semibold " +
    "no-underline transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
  btnPrimary: "bg-linear-to-br from-tint to-tint-2 text-white",
  btnPlain: "bg-fill text-label hover:bg-fill-strong",
  segmented: "inline-flex rounded-[9px] bg-fill p-0.5",
  segment:
    "min-h-8 cursor-pointer rounded-[7px] border-0 bg-transparent px-3 text-[0.85rem] font-medium text-label-2 " +
    "aria-pressed:bg-surface-raised aria-pressed:text-label aria-pressed:shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
  skeleton:
    "animate-shimmer rounded-[10px] bg-[linear-gradient(90deg,var(--fill)_0,var(--fill-strong)_50%,var(--fill)_100%)] bg-size-[400px_100%]",
} as const;

const PILL_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.78rem] font-medium";

const PILL_TONES = {
  neutral: "bg-fill text-label-2",
  tint: "bg-tint-soft text-tint",
  ok: "bg-ok/15 text-ok",
  bad: "bg-danger/15 text-danger",
  warn: "bg-warn/15 text-warn",
} as const;

export function pill(tone: keyof typeof PILL_TONES = "neutral"): string {
  return `${PILL_BASE} ${PILL_TONES[tone]}`;
}
