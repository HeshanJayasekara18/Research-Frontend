import { NextResponse } from "next/server";

import { parseAskInput } from "@/features/knowledge-assistant/api/validate";
import { authorizeVideoAccess } from "@/features/knowledge-assistant/server/access";
import { callRagService, errorBody } from "@/features/knowledge-assistant/server/ragService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "X-Request-ID": requestId } });

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json(errorBody("invalid_json", "Request body must be JSON.", requestId), 400);
  }

  const parsed = parseAskInput(input);
  if (!parsed.ok) return json(errorBody("invalid_request", parsed.message, requestId), 422);

  // Authorise on the server BEFORE calling the backend; the backend never checks ownership.
  const access = await authorizeVideoAccess(request, parsed.value.scope.video_id);
  if (!access.allowed) return json(errorBody(access.code, access.message, requestId), access.status);

  const upstream = await callRagService("/v1/ask", { method: "POST", body: parsed.value, requestId });
  return json(upstream.body, upstream.status);
}
