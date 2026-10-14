"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/shell/Icon";
import { cn, ui } from "@/components/ui/styles";

import { useHealth } from "../hooks/useHealth";
import { timeAgo, useRecentSearches } from "../hooks/useRecentSearches";

function greeting(h: number) {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function DashboardOverview() {
  const health = useHealth();
  const recent = useRecentSearches();
  // Time-of-day greeting is computed on the client to avoid a server/client mismatch.
  const [hello, setHello] = useState("Welcome");
  useEffect(() => setHello(greeting(new Date().getHours())), []);

  const h = health.health;

  return (
    <div className={ui.page}>
      <section className="rounded-[20px] border border-separator bg-(image:--hero) p-[22px] md:p-8">
        <div className="max-w-[640px]">
          <h1 className="text-[2rem] font-bold">{hello} 👋</h1>
          <p className={ui.pageSubtitle}>Make better content with real insights from your audience&apos;s own words.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Stat icon="chat" value={h ? h.corpus_documents.toLocaleString() : "–"} label="Comments indexed" loading={health.loading} />
            <Stat icon="video" value={h ? String(h.videos) : "–"} label="Videos" loading={health.loading} />
            <Stat
              icon="globe"
              value={h ? (h.semantic.index_present ? "On" : "Off") : "–"}
              label="Meaning search"
              loading={health.loading}
            />
          </div>
          {health.error && <p className="mb-0 mt-3 text-[0.85rem] text-danger">The assistant service is offline: {health.error}</p>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Link href="/knowledge-assistant" className={cn("grid content-start gap-1.5 rounded-[20px] border border-separator bg-surface p-5 text-label no-underline shadow-soft transition-transform hover:-translate-y-px [&_strong]:block [&_strong]:text-[1.05rem]", "grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 bg-(image:--hero) [&>span:nth-child(2)]:grid [&>span:nth-child(2)]:gap-0.5")}>
          <span className="grid size-[52px] place-items-center rounded-2xl bg-linear-to-br from-tint to-tint-2 text-white" aria-hidden>
            <Icon name="sparkle" size={22} />
          </span>
          <span>
            <strong>Ask your Knowledge Assistant</strong>
            <span className={ui.muted}>Find what viewers said about any topic, in Singlish, Sinhala or English.</span>
          </span>
          <span className="grid size-10 place-items-center rounded-full bg-tint text-white" aria-hidden>
            <Icon name="arrow" />
          </span>
        </Link>

        <Link href="/knowledge-assistant/evidence" className="grid content-start gap-1.5 rounded-[20px] border border-separator bg-surface p-5 text-label no-underline shadow-soft transition-transform hover:-translate-y-px [&_strong]:block [&_strong]:text-[1.05rem]">
          <span className="mb-1 grid size-9 place-items-center rounded-[10px] bg-fill text-label-2" aria-hidden>
            <Icon name="chart" />
          </span>
          <strong>Evidence &amp; Analysis</strong>
          <span className={ui.muted}>Compare retrieval methods side by side on one question.</span>
        </Link>
      </section>

      <section className={ui.card} aria-labelledby="recent-title">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-title" className={ui.sectionTitle}>
            Recent questions
          </h2>
          <Link href="/knowledge-assistant" className="inline-flex items-center gap-1 text-[0.85rem] text-tint no-underline">
            Open assistant <Icon name="arrow" size={14} />
          </Link>
        </div>
        {recent.items.length === 0 ? (
          <p className={ui.muted}>No questions yet. Your recent searches will show here (stored only in this browser).</p>
        ) : (
          <ul className="m-0 list-none p-0 [&>li]:grid [&>li]:grid-cols-[auto_minmax(0,1fr)] [&>li]:items-center [&>li]:gap-2.5 [&>li]:border-t [&>li]:border-separator [&>li]:py-2.5 [&>li]:text-label-3 [&>li:first-child]:border-t-0 md:[&>li]:grid-cols-[auto_minmax(0,1fr)_auto]">
            {recent.items.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Icon name="clock" size={16} />
                <span className="truncate text-label">{r.query}</span>
                <span className={cn(ui.caption, "col-start-2 md:col-start-auto")}>
                  {r.videoId ?? "All videos"} · {timeAgo(r.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="team-title">
        <h2 id="team-title" className={cn(ui.sectionTitle, "mb-3")}>
          Other modules
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          {[
            { href: "/market-research", t: "Market Research", o: "C1" },
            { href: "/video-prediction", t: "Video Prediction", o: "C2" },
            { href: "/analytics", t: "Analytics", o: "C4" },
          ].map((m) => (
            <Link key={m.href} href={m.href} className="grid gap-0.5 rounded-[14px] border border-dashed border-separator p-4 text-label no-underline hover:bg-fill">
              <strong>{m.t}</strong>
              <span className={ui.caption}>{m.o} · coming soon</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, loading }: { icon: "chat" | "video" | "globe"; value: string; label: string; loading: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] border border-separator bg-surface px-3.5 py-2.5 [&>span:last-child]:grid [&_b]:text-[1.1rem] [&_b]:tabular-nums">
      <span className="grid size-8 place-items-center rounded-[10px] bg-tint-soft text-tint" aria-hidden>
        <Icon name={icon} size={16} />
      </span>
      <span>
        {loading ? <span className={cn(ui.skeleton, "block h-[18px] w-12")} /> : <b>{value}</b>}
        <span className={ui.caption}>{label}</span>
      </span>
    </div>
  );
}
