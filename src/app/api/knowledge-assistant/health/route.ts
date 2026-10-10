import { NextResponse } from "next/server";

import { callRagService } from "@/features/knowledge-assistant/server/ragService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = crypto.randomUUID();
  const upstream = await callRagService("/v1/health", { method: "GET", requestId });
  return NextResponse.json(upstream.body, { status: upstream.status, headers: { "X-Request-ID": requestId } });
}
