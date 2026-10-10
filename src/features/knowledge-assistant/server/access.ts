import "server-only";

/**
 * Authorisation boundary for video-scoped retrieval.
 *
 * The backend treats `video_id` purely as a search filter and never verifies
 * ownership, so this check MUST happen here, on the server, using the platform's
 * own session and data. A video or creator ID sent by the browser is never proof
 * of ownership.
 *
 * TODO(c3): replace with the team's shared auth once it exists (session lookup,
 * then "does this user own/manage the channel of this video?").
 */
export type AccessDecision =
  | { allowed: true; mode: "dev-allow-all" | "authorized" }
  | { allowed: false; status: 401 | 403 | 501; code: string; message: string };

export async function authorizeVideoAccess(_request: Request, videoId: string | null): Promise<AccessDecision> {
  const devAllowAll =
    process.env.NODE_ENV !== "production" && process.env.KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS === "true";

  if (devAllowAll) return { allowed: true, mode: "dev-allow-all" };

  if (!videoId) {
    return { allowed: false, status: 403, code: "video_required", message: "Select a video to search." };
  }
  // No platform login is integrated yet: deny instead of guessing.
  return {
    allowed: false,
    status: 501,
    code: "auth_not_configured",
    message: "Video access checks are not configured yet. For local development set KNOWLEDGE_ASSISTANT_DEV_ALLOW_ALL_VIDEOS=true.",
  };
}
