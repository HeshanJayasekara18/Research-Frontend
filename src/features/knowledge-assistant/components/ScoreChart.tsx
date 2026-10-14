import { cn, ui } from "@/components/ui/styles";

export interface ChartSeries {
  name: string;
  color: string;
  values: number[]; // 0..1, index = rank - 1
}

/** Grouped bar chart (rank on x, relative score on y). Plain SVG, no chart library. */
export function ScoreChart({ series }: { series: ChartSeries[] }) {
  const ranks = Math.max(0, ...series.map((s) => s.values.length));
  if (!series.length || !ranks) return <p className={ui.caption}>No scores to chart.</p>;

  const W = 320;
  const H = 170;
  const pad = { l: 28, r: 6, t: 8, b: 22 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const group = plotW / ranks;
  const barW = Math.min(14, (group - 8) / series.length);
  const y = (v: number) => pad.t + plotH * (1 - v);

  const summary = series.map((s) => `${s.name}: ${s.values.map((v) => Math.round(v * 100) + "%").join(", ")}`).join("; ");

  return (
    <figure className="mx-0 mb-0 mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Relative score by rank. ${summary}`}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--separator)" />
            <text x={pad.l - 6} y={y(t) + 3} fontSize="9" textAnchor="end" fill="var(--label-tertiary)">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {Array.from({ length: ranks }, (_, r) => {
          const gx = pad.l + r * group + (group - barW * series.length) / 2;
          return (
            <g key={r}>
              {series.map((s, i) =>
                s.values[r] === undefined ? null : (
                  <rect
                    key={s.name}
                    x={gx + i * barW}
                    y={y(s.values[r])}
                    width={Math.max(2, barW - 2)}
                    height={plotH * s.values[r]}
                    rx={2}
                    fill={s.color}
                  >
                    <title>{`${s.name} #${r + 1}: ${Math.round(s.values[r] * 100)}% of top`}</title>
                  </rect>
                ),
              )}
              <text x={pad.l + r * group + group / 2} y={H - 6} fontSize="9" textAnchor="middle" fill="var(--label-tertiary)">
                #{r + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {series.map((s) => (
          <span key={s.name} className={cn(ui.caption, "inline-flex items-center gap-1.5")}>
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
