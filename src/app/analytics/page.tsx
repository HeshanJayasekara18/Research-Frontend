import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

// Placeholder owned by C4. Replace with src/features/analytics when that feature lands.
export default function Page() {
  return (
    <div className="max-w-[720px] [&>p]:text-label-2">
      <h1>Analytics</h1>
      <p>Coming soon (C4).</p>
    </div>
  );
}
