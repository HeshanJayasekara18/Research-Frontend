import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Creator Research Platform", template: "%s · Creator Research Platform" },
  description: "Market research, video prediction, knowledge assistant and analytics for YouTube creators.",
};

const NAV = [
  { href: "/market-research", label: "Market Research" },
  { href: "/video-prediction", label: "Video Prediction" },
  { href: "/knowledge-assistant", label: "Knowledge Assistant" },
  { href: "/analytics", label: "Analytics" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topnav">
          <Link href="/" className="brand">
            Creator Research
          </Link>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
