"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./Icon";
import { TopBar } from "./TopBar";

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

// Floating charcoal rail (icon above a short label) on desktop with the Youbeyo avatar
// overhanging its top edge; a bottom tab bar on phones (< md). Accent colours come from
// the bot itself (warm orange + cyan). The rail stays dark in both light and dark mode.
const LINK =
  "group flex flex-col items-center gap-[3px] rounded-[14px] px-0.5 py-1.5 text-center text-[rgba(242,242,244,0.68)] no-underline " +
  "transition-colors hover:bg-white/7 hover:text-[#f2f2f4] focus-visible:outline-2 focus-visible:-outline-offset-2 " +
  "focus-visible:outline-white md:gap-[5px] md:py-2.5 " +
  "aria-[current=page]:bg-[linear-gradient(160deg,rgba(255,138,61,0.24),rgba(57,208,255,0.14))] aria-[current=page]:text-white " +
  "aria-[current=page]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]";

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
        <span className="transition-colors group-aria-[current=page]:text-[#ffb27a]">
          <Icon name={item.icon} size={22} />
        </span>
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

      {/* Non-scrolling wrapper: Youbeyo sits on the rail's top edge, which a scrolling element would clip.
          Geometry (youbeyosit.png is a 1024px transparent canvas): the robot spans x 30–75%, y 16–77%,
          and its seat/resting hand are at ~60% height. The 184px canvas is placed so that 60% line lands
          exactly on the rail's top edge (102px), centred on the rail (56px), so the legs dangle over the front. */}
      <div className="md:sticky md:top-0 md:h-dvh md:py-2.5 md:pl-2.5">
        {/* Click target covers only the robot's body above the rail, so it never blocks the nav items. */}
        <Link
          href="/"
          className={
            "peer absolute left-[16px] top-[20px] z-30 hidden h-[82px] w-[80px] rounded-2xl md:block " +
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          }
          aria-label="Youbeyo home"
          title="Youbeyo"
        />
        <Image
          src="/images/youbeyosit.png"
          alt=""
          aria-hidden
          width={184}
          height={184}
          priority
          className={
            "pointer-events-none absolute -left-[40px] -top-[8px] z-20 hidden size-[184px] max-w-none md:block " +
            "drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)] transition-transform duration-200 " +
            "peer-hover:-translate-y-1 peer-focus-visible:-translate-y-1"
          }
        />

        <aside
          className={
            "fixed inset-x-2 bottom-2 z-10 flex flex-row items-center overflow-x-auto rounded-[20px] border border-white/8 p-1.5 " +
            "bg-[#141519] text-[#f2f2f4] shadow-[0_10px_30px_rgba(0,0,0,0.3)] [scrollbar-width:none] " +
            // Rail starts where Youbeyo sits and runs to the bottom of the screen with a 10px gap
            // (wrapper py-2.5 top/bottom + 92px seat offset = 112px); scrolls only on very short screens.
            "md:static md:mt-[92px] md:h-[calc(100dvh-112px)] md:w-[92px] md:flex-col md:overflow-y-auto md:rounded-[22px] " +
            "md:bg-[linear-gradient(180deg,#1b1c21_0%,#141519_40%,#0f1013_100%)] md:px-1.5 md:pb-3.5 md:pt-[44px]"
          }
        >
          <nav aria-label="Main" className="flex w-full md:block">
            <ul className="contents md:m-0 md:grid md:list-none md:gap-1 md:p-0">{PRIMARY.map(link)}</ul>
            <hr className="mx-auto my-2.5 hidden w-9 border-0 border-t border-white/8 md:block" />
            <ul aria-label="Team modules" className="contents md:m-0 md:grid md:list-none md:gap-1 md:p-0">
              {TEAM.map(link)}
            </ul>
          </nav>

          {/* Profile, pinned to the bottom of the rail. Platform login isn't integrated yet, so this
              shows a generic avatar instead of a real user. Swap in the signed-in user's photo later. */}
          <div className="mt-auto hidden w-full flex-col items-center gap-1.5 pt-4 md:flex">
            <hr className="mb-2 w-9 border-0 border-t border-white/8" />
            <div
              className={
                "grid size-11 place-items-center rounded-full p-[2px] " +
                "bg-[conic-gradient(from_200deg,#ff8a3d,#ffd36b,#39d0ff,#5a7cff,#b34dff,#ff8a3d)]"
              }
              role="img"
              aria-label="Profile (sign-in coming soon)"
              title="Profile: sign-in coming soon"
            >
              <span className="grid size-full place-items-center rounded-full bg-[#24262d] text-[rgba(242,242,244,0.8)]">
                <Icon name="user" size={22} />
              </span>
            </div>
            <span className="text-[0.66rem] font-semibold text-[rgba(242,242,244,0.55)]">Profile</span>
          </div>
        </aside>
      </div>

      <div className="flex min-w-0 flex-col">
        <TopBar title={[...PRIMARY, ...TEAM].find((i) => i.href === active)?.title ?? "Dashboard"} />
        <main id="main" className="min-w-0 px-4 pb-[104px] pt-5 md:px-[clamp(16px,3vw,40px)] md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
