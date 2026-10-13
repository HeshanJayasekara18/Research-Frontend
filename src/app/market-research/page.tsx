import type { Metadata } from "next";

export const metadata: Metadata = { title: "Market Research" };

// Placeholder owned by C1. Replace with src/features/market-research when that feature lands.
export default function Page() {
  return (
    <div className="max-w-[720px] [&>p]:text-label-2">
      <h1>Market Research</h1>
      <p>Coming soon (C1).</p>
    </div>
  );
}
