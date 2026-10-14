// Small SF-Symbols-like line icons (1.6px stroke, 24px grid). Decorative by default.
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  chat: "M4 5h16v11H8l-4 4z M8 9.5h8 M8 12.5h5",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  market: "M3 3v18h18 M7 15l4-4 3 3 6-6",
  video: "M3 6h13v12H3z M16 10l5-3v10l-5-3",
  analytics: "M12 3a9 9 0 1 0 9 9h-9z M14 2.5A8 8 0 0 1 21.5 10H14z",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M20 20l-4.8-4.8",
  send: "M4 12 20 4l-6 16-3-7z M11 13l9-9",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  external: "M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v6 M12 7.5v.5",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  moonStar: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z M17 3l.6 1.6L19 5l-1.4.4L17 7l-.6-1.6L15 5l1.4-.4z",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
