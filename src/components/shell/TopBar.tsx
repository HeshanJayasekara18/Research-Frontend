"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/styles";

import { Icon, type IconName } from "./Icon";
import { currentTheme, setTheme, THEMES, type Theme } from "./theme";

const THEME_META: Record<Theme, { label: string; icon: IconName }> = {
  light: { label: "Light", icon: "sun" },
  dark: { label: "Dark", icon: "moon" },
  superdark: { label: "Super dark", icon: "moonStar" },
};

const ICON_BTN =
  "relative grid size-9 place-items-center rounded-full text-label-2 transition-colors hover:bg-fill hover:text-label";

/** Thin top bar: current page on the left; notifications and one theme button on the right. */
export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b border-separator bg-bg/80 px-4 backdrop-blur-md md:px-[clamp(16px,3vw,40px)]">
      <span className="truncate text-[0.86rem] font-semibold text-label-2">{title}</span>
      <div className="flex flex-none items-center gap-1">
        <Notifications />
        <ThemeButton />
      </div>
    </header>
  );
}

/** One button cycles Light → Dark → Super dark. */
function ThemeButton() {
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => setThemeState(currentTheme()), []);
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  return (
    <button
      type="button"
      className={ICON_BTN}
      onClick={() => {
        setTheme(next);
        setThemeState(next);
      }}
      aria-label={`${THEME_META[theme].label} mode. Switch to ${THEME_META[next].label.toLowerCase()} mode`}
      title={`${THEME_META[theme].label} mode (click for ${THEME_META[next].label.toLowerCase()})`}
    >
      <Icon name={THEME_META[theme].icon} size={18} />
    </button>
  );
}

/** Notification bell. No notification service exists yet, so the panel says so (no fake alerts). */
function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(ICON_BTN, open && "bg-fill text-label")}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" size={18} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 w-[min(300px,calc(100vw-32px))] rounded-2xl border border-separator bg-surface-raised p-4 shadow-soft"
        >
          <p className="m-0 text-[0.9rem] font-semibold">Notifications</p>
          <div className="mt-3 grid justify-items-center gap-1.5 rounded-xl bg-fill px-3 py-5 text-center">
            <Icon name="bell" size={20} />
            <p className="m-0 text-[0.86rem] font-medium">No notifications yet</p>
            <p className="m-0 text-[0.78rem] text-label-3">Updates from your research tools will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
