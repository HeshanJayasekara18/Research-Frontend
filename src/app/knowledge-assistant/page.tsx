import type { Metadata } from "next";

import { AssistantWorkspace } from "@/features/knowledge-assistant/components/AssistantWorkspace";

export const metadata: Metadata = { title: "Knowledge Assistant" };

export default function KnowledgeAssistantPage() {
  return <AssistantWorkspace />;
}
