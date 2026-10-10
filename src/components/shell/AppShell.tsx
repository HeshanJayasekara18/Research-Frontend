"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "./Icon";
import styles from "./AppShell.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const PRIMARY: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/knowledge-assistant", label: "Knowledge Assistant", icon: "chat" },
  { href: "/knowledge-assistant/evidence", label: "Evidence & Analysis", icon: "chart" },
];

const TEAM: NavItem[] = [
  { href: "/market-research", label: "Market Research", icon: "market" },
  { href: "/video-prediction", label: "Video Prediction", icon: "video" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
];

/** Longest matching href wins, so /knowledge-assistant/evidence doesn't also highlight its parent. */
function activeHref(pathname: string): string | undefined {
  return [...PRIMARY, ...TEAM]
    .map((i) => i.href)
    .filter((h) => pathname === h || (h !== "/" && pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const active = activeHref(pathname);

  const link = (item: NavItem) => (
    <li key={item.href}>
      <Link
        href={item.href}
        className={styles.navLink}
        aria-current={active === item.href ? "page" : undefined}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </Link>
    </li>
  );

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden>
            <Icon name="sparkle" size={16} />
          </span>
          <span>
            Creator Knowledge
            <br />
            Assistant
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className={styles.nav}>{PRIMARY.map(link)}</ul>
          <p className={styles.section}>Team modules</p>
          <ul className={styles.nav}>{TEAM.map(link)}</ul>
        </nav>
      </aside>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
