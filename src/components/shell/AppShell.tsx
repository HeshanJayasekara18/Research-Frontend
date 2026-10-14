"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./Icon";

interface NavItem {
  href: string;
  label: string; // short: the rail is narrow
  title: string; // full name for tooltips / screen readers
  icon: IconName;
  badge?: string;
}

const PRIMARY: NavItem[] = [
  { href: "/", label: "Dashboard", title: "Dashboard", icon: "home" },
  { href: "/knowledge-assistant", label: "Assistant", title: "Knowledge Assistant", icon: "chat" },
  { href: "/knowledge-assistant/evidence", label: "Evidence", title: "Evidence & Analysis", icon: "chart", badge: "Beta" },
];

const TEAM: NavItem[] = [
  { href: "/market-research", label: "Market", title: "Market Research", icon: "market" },
  { href: "/video-prediction", label: "Prediction", title: "Video Prediction", icon: "video" },
  { href: "/analytics", label: "Analytics", title: "Analytics", icon: "analytics" },
];

/** Longest matching href wins, so /knowledge-assistant/evidence doesn't also highlight its parent. */
function activeHref(pathname: string): string | undefined {
  return [...PRIMARY, ...TEAM]
    .map((i) => i.href)
    .filter((h) => pathname === h || (h !== "/" && pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

// Floating dark rail (icon above a short label) on desktop; a bottom tab bar on phones (< md).
// The rail stays dark in both light and dark mode.
const LINK =
  "flex flex-col items-center gap-[3px] rounded-[14px] px-0.5 py-1.5 text-center text-[rgba(242,242,244,0.72)] no-underline " +
  "transition-colors hover:bg-white/7 hover:text-[#f2f2f4] aria-[current=page]:bg-white/12 aria-[current=page]:text-[#f2f2f4] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white md:gap-[5px] md:py-2.5";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const active = activeHref(pathname);

  const link = (item: NavItem) => (
    <li key={item.href} className="min-w-0 flex-1 md:flex-none">
      <Link
        href={item.href}
        className={LINK}
        aria-current={active === item.href ? "page" : undefined}
        aria-label={item.badge ? `${item.title} (${item.badge})` : item.title}
        title={item.title}
      >
        <Icon name={item.icon} size={22} />
        <span className="max-w-full truncate text-[clamp(0.58rem,2.6vw,0.72rem)] font-semibold leading-[1.15] tracking-[0.01em] md:text-[0.72rem]">
          {item.label}
        </span>
        {item.badge && (
          <span className="-mt-px hidden rounded-full bg-white px-[9px] text-[0.66rem] font-bold leading-normal text-[#111] md:inline" aria-hidden>
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[112px_minmax(0,1fr)]">
      <a
        href="#main"
        className="absolute -left-[9999px] focus:left-4 focus:top-3 focus:z-20 focus:rounded-[10px] focus:bg-surface-raised focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside
        className={
          "fixed inset-x-2 bottom-2 z-10 flex flex-row items-center gap-3.5 overflow-x-auto rounded-[20px] border border-white/8 " +
          "bg-[#141416] p-1.5 text-[#f2f2f4] shadow-[0_10px_30px_rgba(0,0,0,0.25)] [scrollbar-width:none] " +
          "md:sticky md:inset-auto md:top-2.5 md:my-2.5 md:ml-2.5 md:h-[calc(100dvh-20px)] md:w-[92px] md:flex-col md:overflow-y-auto " +
          "md:rounded-[22px] md:px-1.5 md:py-3.5"
        }
      >
        <Link
          href="/"
          className="hidden size-11 flex-none place-items-center rounded-[14px] bg-linear-to-br from-tint to-tint-2 text-white md:grid"
          aria-label="Creator Knowledge Assistant home"
          title="Creator Knowledge Assistant"
        >
          <Icon name="sparkle" size={22} />
        </Link>
        <nav aria-label="Main" className="flex w-full md:block">
          <ul className="contents md:m-0 md:grid md:list-none md:gap-1 md:p-0">{PRIMARY.map(link)}</ul>
          <hr className="mx-auto my-2.5 hidden w-9 border-0 border-t border-white/8 md:block" />
          <ul aria-label="Team modules" className="contents md:m-0 md:grid md:list-none md:gap-1 md:p-0">
            {TEAM.map(link)}
          </ul>
        </nav>
      </aside>
      <main id="main" className="min-w-0 px-4 pb-[104px] pt-5 md:px-[clamp(16px,3vw,40px)] md:py-7">
        {children}
      </main>
    </div>
  );
}
