import type { Metadata } from "next";

export const metadata: Metadata = { title: "Video Prediction" };

// Placeholder owned by C2. Replace with src/features/video-prediction when that feature lands.
export default function Page() {
  return (
    <div className="max-w-[720px] [&>p]:text-label-2">
      <h1>Video Prediction</h1>
      <p>Coming soon (C2).</p>
    </div>
  );
}
