"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/shell/Icon";

import { useHealth } from "../hooks/useHealth";
import { timeAgo, useRecentSearches } from "../hooks/useRecentSearches";
import styles from "./dashboard.module.css";

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
    <div className="page">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.hello}>{hello} 👋</h1>
          <p className="page-subtitle">Make better content with real insights from your audience&apos;s own words.</p>
          <div className={styles.stats}>
            <Stat icon="chat" value={h ? h.corpus_documents.toLocaleString() : "–"} label="Comments indexed" loading={health.loading} />
            <Stat icon="video" value={h ? String(h.videos) : "–"} label="Videos" loading={health.loading} />
            <Stat
              icon="globe"
              value={h ? (h.semantic.index_present ? "On" : "Off") : "–"}
              label="Meaning search"
              loading={health.loading}
            />
          </div>
          {health.error && <p className={styles.offline}>The assistant service is offline: {health.error}</p>}
        </div>
      </section>

      <section className={styles.grid}>
        <Link href="/knowledge-assistant" className={`${styles.cta} ${styles.tile}`}>
          <span className={styles.ctaIcon} aria-hidden>
            <Icon name="sparkle" size={22} />
          </span>
          <span>
            <strong>Ask your Knowledge Assistant</strong>
            <span className="muted">Find what viewers said about any topic, in Singlish, Sinhala or English.</span>
          </span>
          <span className={styles.go} aria-hidden>
            <Icon name="arrow" />
          </span>
        </Link>

        <Link href="/knowledge-assistant/evidence" className={styles.tile}>
          <span className={styles.tileIcon} aria-hidden>
            <Icon name="chart" />
          </span>
          <strong>Evidence &amp; Analysis</strong>
          <span className="muted">Compare retrieval methods side by side on one question.</span>
        </Link>
      </section>

      <section className="card" aria-labelledby="recent-title">
        <div className={styles.cardHead}>
          <h2 id="recent-title" className="section-title">
            Recent questions
          </h2>
          <Link href="/knowledge-assistant" className={styles.more}>
            Open assistant <Icon name="arrow" size={14} />
          </Link>
        </div>
        {recent.items.length === 0 ? (
          <p className="muted">No questions yet. Your recent searches will show here (stored only in this browser).</p>
        ) : (
          <ul className={styles.recent}>
            {recent.items.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Icon name="clock" size={16} />
                <span className={styles.recentQ}>{r.query}</span>
                <span className="caption">
                  {r.videoId ?? "All videos"} · {timeAgo(r.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="team-title">
        <h2 id="team-title" className="section-title" style={{ marginBottom: 12 }}>
          Other modules
        </h2>
        <div className={styles.team}>
          {[
            { href: "/market-research", t: "Market Research", o: "C1" },
            { href: "/video-prediction", t: "Video Prediction", o: "C2" },
            { href: "/analytics", t: "Analytics", o: "C4" },
          ].map((m) => (
            <Link key={m.href} href={m.href} className={styles.teamTile}>
              <strong>{m.t}</strong>
              <span className="caption">{m.o} · coming soon</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, loading }: { icon: "chat" | "video" | "globe"; value: string; label: string; loading: boolean }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon} aria-hidden>
        <Icon name={icon} size={16} />
      </span>
      <span>
        {loading ? <span className="skeleton" style={{ display: "block", width: 48, height: 18 }} /> : <b>{value}</b>}
        <span className="caption">{label}</span>
      </span>
    </div>
  );
}
