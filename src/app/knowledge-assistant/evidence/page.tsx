import type { Metadata } from "next";
import { Suspense } from "react";

import { EvidenceAnalysis } from "@/features/knowledge-assistant/components/EvidenceAnalysis";

export const metadata: Metadata = { title: "Evidence & Analysis" };

export default function EvidencePage() {
  // useSearchParams() in EvidenceAnalysis requires a Suspense boundary.
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <EvidenceAnalysis />
    </Suspense>
  );
}
