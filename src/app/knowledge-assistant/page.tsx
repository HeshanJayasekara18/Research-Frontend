import type { Metadata } from "next";

import { KnowledgeAssistant } from "@/features/knowledge-assistant/components/KnowledgeAssistant";

export const metadata: Metadata = { title: "Knowledge Assistant" };

export default function KnowledgeAssistantPage() {
  return <KnowledgeAssistant />;
}
