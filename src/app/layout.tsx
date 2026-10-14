import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/shell/AppShell";
import { THEME_SCRIPT } from "@/components/shell/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Creator Knowledge Assistant", template: "%s · Creator Knowledge Assistant" },
  description: "Understand your audience from your own YouTube comments, in Singlish, Sinhala or English.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1014" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set by THEME_SCRIPT before paint, hence suppressHydrationWarning.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
