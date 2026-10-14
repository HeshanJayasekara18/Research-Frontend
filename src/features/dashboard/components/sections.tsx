"use client";

import Link from "next/link";

import { Icon, type IconName } from "@/components/shell/Icon";
import { cn } from "@/components/ui/styles";
import type { HealthState } from "@/features/knowledge-assistant/hooks/useHealth";
import { timeAgo, type RecentSearch } from "@/features/knowledge-assistant/hooks/useRecentSearches";

import { ArtImage, EmptyNote, ENTER, PANEL, SectionHeader } from "./parts";

/* =========================================================================
   Dashboard body sections. Honesty rule: every figure comes from a live API
   (currently only C3's /health) or browser state; everything else shows an
   explicit empty state. No invented channels, videos, views or likes.
   ========================================================================= */

const BTN = "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.88rem] font-semibold no-underline transition active:scale-[0.97]";

/* ---------------- A (left). Creator Studio hero ---------------- */

export function CreatorHero({ image }: { image: string | null }) {
  return (
    <section
      aria-labelledby="hero-title"
      className={cn(
        PANEL,
        ENTER,
        "relative isolate flex min-h-[340px] overflow-hidden bg-transparent sm:min-h-[300px] md:min-h-[clamp(260px,22vw,380px)]",
      )}
    >
      {/* The image IS the background: full-bleed layer behind the text (no coloured panel). */}
      <div className="absolute inset-0 -z-20" aria-hidden>
        <ArtImage
          src={image}
          alt=""
          icon="video"
          tone="indigo"
          sizes="(max-width: 1280px) 100vw, 70vw"
          priority
          className="size-full"
        />
      </div>
      {/* Dark scrim: strong behind the text, fading out so the photo stays the focus. */}
      <div
        className={
          "absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.25)_100%)] " +
          "md:bg-[linear-gradient(to_right,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.7)_35%,rgba(0,0,0,0.2)_70%,transparent_100%)]"
        }
        aria-hidden
      />

      <div className="flex max-w-[560px] flex-col justify-end p-5 text-white sm:p-6 md:justify-center md:p-8 2xl:p-10">
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[0.72rem] font-semibold text-white/85 backdrop-blur-sm">
          <Icon name="sparkle" size={13} /> Creator Studio
        </span>
        <h1
          id="hero-title"
          className="text-[clamp(1.45rem,2.4vw,2.4rem)] font-bold leading-[1.15] tracking-[-0.025em] [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]"
        >
          Create smarter content.
        </h1>
        <p className="mb-0 mt-2 max-w-[44ch] text-[0.92rem] text-white/80 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          Discover opportunities, understand your audience, and make better content decisions with AI.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <a href="#creator-tools" className={cn(BTN, "bg-tint text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:brightness-110")}>
            Explore Creator Tools
          </a>
          <Link href="/knowledge-assistant" className={cn(BTN, "border border-white/20 bg-black/35 text-white backdrop-blur-sm hover:bg-black/50")}>
            <Icon name="chat" size={16} /> Ask Youbeyo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- A (right). Channel overview ---------------- */

export function ChannelOverview({ health }: { health: HealthState }) {
  const h = health.health;
  return (
    <section aria-labelledby="channel-title" className={cn(PANEL, ENTER, "flex flex-col p-5 [animation-delay:60ms]")}>
      <SectionHeader id="channel-title" title="Channel overview" />

      <div className="flex items-center gap-3 rounded-2xl bg-fill p-3">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-surface text-label-3" aria-hidden>
          <Icon name="video" size={18} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-[0.9rem] font-semibold">No channel connected</p>
          <p className="m-0 text-[0.76rem] text-label-3">Channel connection isn&apos;t available yet</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Channel videos" value={null} />
        <Stat label="Subscribers" value={null} />
      </dl>

      <div className="mt-4 border-t border-separator pt-4">
        <p className="m-0 mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.05em] text-label-3">
          Audience data available (research corpus)
        </p>
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Comments" value={h ? h.corpus_documents.toLocaleString() : null} loading={health.loading} />
          <Stat label="Videos" value={h ? String(h.videos) : null} loading={health.loading} />
        </dl>
      </div>

      <p className="mb-0 mt-auto flex items-center gap-2 pt-4 text-[0.8rem] text-label-2">
        <span
          className={cn("size-2 rounded-full", health.loading ? "bg-label-3" : h ? "bg-ok" : "bg-danger")}
          aria-hidden
        />
        {health.loading ? "Checking Knowledge Assistant…" : h ? "Knowledge Assistant online" : "Knowledge Assistant offline"}
      </p>
    </section>
  );
}

function Stat({ label, value, loading = false }: { label: string; value: string | null; loading?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.74rem] text-label-3">{label}</dt>
      <dd className="m-0 mt-0.5">
        {loading ? (
          <span className="block h-5 w-12 animate-pulse rounded bg-fill-strong" aria-label="Loading" />
        ) : value === null ? (
          <span className="text-[0.88rem] font-medium text-label-3">Not available</span>
        ) : (
          <span className="text-[1.2rem] font-semibold tabular-nums">{value}</span>
        )}
      </dd>
    </div>
  );
}

/* ---------------- B. Feature card ---------------- */

export function FeatureCard({
  href,
  title,
  description,
  image,
  icon,
  tone,
  status,
  containImage = false,
}: {
  href: string;
  title: string;
  description: string;
  image: string | null;
  icon: IconName;
  tone: "indigo" | "coral" | "teal" | "violet";
  status: "live" | "soon";
  containImage?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        PANEL,
        "group flex flex-col overflow-hidden text-label no-underline",
        "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-tint/40 hover:shadow-[0_14px_34px_rgba(0,0,0,0.18)]",
      )}
    >
      <ArtImage src={image} alt="" icon={icon} tone={tone} contain={containImage} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="aspect-[4/3]" />
      <div className="flex flex-1 items-end justify-between gap-3 p-4 2xl:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[0.98rem] font-semibold 2xl:text-[1.05rem]">{title}</h3>
            {status === "live" ? (
              <span className="rounded-full bg-ok/15 px-2 py-px text-[0.68rem] font-semibold text-ok">Live</span>
            ) : (
              <span className="rounded-full bg-fill px-2 py-px text-[0.68rem] font-semibold text-label-3">Coming soon</span>
            )}
          </div>
          <p className="m-0 mt-1 min-h-[2.6em] text-[0.82rem] text-label-3">{description}</p>
        </div>
        <span
          className="grid size-9 flex-none place-items-center rounded-full bg-fill text-label-2 transition group-hover:bg-tint group-hover:text-white"
          aria-hidden
        >
          <Icon name="arrow" size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------- C (left). Content opportunities ---------------- */

export function ContentOpportunities() {
  return (
    <section aria-labelledby="opps-title" className={cn(PANEL, "p-5")}>
      <SectionHeader
        id="opps-title"
        title="Content opportunities"
        description="Topics and trends discovered by Market Research"
        action={
          <Link href="/market-research" className="inline-flex items-center gap-1 text-[0.84rem] font-medium text-tint no-underline">
            Open <Icon name="arrow" size={14} />
          </Link>
        }
      />
      <EmptyNote icon="market" title="No opportunities to show yet">
        Market Research (C1) isn&apos;t connected to this workspace yet. Emerging topics and audience-demand insights will
        appear here once it is.
      </EmptyNote>
    </section>
  );
}

/* ---------------- C (right). Recommended next actions ---------------- */

export function RecommendedActions({ assistantOnline, checking }: { assistantOnline: boolean; checking: boolean }) {
  const items: { href: string; label: string; icon: IconName; state: "ready" | "soon" | "offline" | "checking" }[] = [
    { href: "/knowledge-assistant", label: "Ask your audience", icon: "chat", state: checking ? "checking" : assistantOnline ? "ready" : "offline" },
    { href: "/market-research", label: "Explore emerging topics", icon: "market", state: "soon" },
    { href: "/video-prediction", label: "Analyze a video", icon: "video", state: "soon" },
    { href: "/analytics", label: "Review analytics", icon: "analytics", state: "soon" },
  ];
  const STATE = {
    ready: { text: "Ready", cls: "text-ok" },
    checking: { text: "Checking…", cls: "text-label-3" },
    offline: { text: "Service offline", cls: "text-danger" },
    soon: { text: "Coming soon", cls: "text-label-3" },
  } as const;
  return (
    <section aria-labelledby="actions-title" className={cn(PANEL, "p-5 [animation-delay:60ms]")}>
      <SectionHeader id="actions-title" title="Recommended next actions" />
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {items.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="group flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 text-label no-underline transition-colors hover:bg-fill"
            >
              <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-tint-soft text-tint" aria-hidden>
                <Icon name={a.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.88rem] font-medium">{a.label}</span>
                <span className={cn("block text-[0.74rem]", STATE[a.state].cls)}>{STATE[a.state].text}</span>
              </span>
              <Icon name="arrow" size={15} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- D. Recent videos (table) ---------------- */

export function RecentVideos() {
  return (
    <section aria-labelledby="videos-title" className={cn(PANEL, "min-w-0 p-5")}>
      <SectionHeader id="videos-title" title="Recent videos" description="Latest uploads from your connected channel" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[0.84rem]">
          <caption className="sr-only">Recent videos from your channel</caption>
          <thead>
            <tr className="text-left text-[0.74rem] text-label-3">
              {["Video", "Published", "Views", "Engagement", ""].map((h, i) => (
                <th key={i} scope="col" className="border-b border-separator px-2 pb-2 font-medium">
                  {h || <span className="sr-only">Open</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-2 pt-4">
                <EmptyNote icon="video" title="No videos loaded">
                  Your recent uploads will be listed here once channel connection is available. No video data is
                  simulated.
                </EmptyNote>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------------- E. Recent activity ---------------- */

export function RecentActivity({ items }: { items: RecentSearch[] }) {
  return (
    <section aria-labelledby="activity-title" className={cn(PANEL, "p-5 [animation-delay:60ms]")}>
      <SectionHeader
        id="activity-title"
        title="Recent activity"
        description="Stored only in this browser"
      />
      {items.length === 0 ? (
        <EmptyNote icon="clock" title="No activity yet">
          Questions you ask Youbeyo will appear here.
        </EmptyNote>
      ) : (
        <ol className="m-0 grid list-none gap-1 p-0">
          {items.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-start gap-3 rounded-xl px-1 py-2">
              <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-full bg-tint-soft text-tint" aria-hidden>
                <Icon name="chat" size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.86rem]">{r.query}</span>
                <span className="block text-[0.74rem] text-label-3">
                  Asked Youbeyo · {r.videoId ? `video ${r.videoId}` : "all videos"} · {timeAgo(r.at)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
