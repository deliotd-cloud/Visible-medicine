/**
 * Education currently has demonstration series metadata, but no protected
 * scan/frame delivery contract or verified playable-object readback.
 * Identifiers, ingestion/quarantine records and client acknowledgements are
 * not evidence of media availability. Keep this boundary closed until the
 * actual source/revision-bound Education delivery adapter exists.
 * This technical availability gate is not clinical or publication approval.
 */
export function educationMediaReadiness(): {
  mediaReady: boolean;
  mediaUnavailableReason: string;
} {
  return {
    mediaReady: false,
    mediaUnavailableReason:
      "Assessment images are not available yet. The assessment cannot start until its images are ready.",
  };
}

/** Preserve frozen review context; never use this to authorize a write. */
export function requiresEducationPreflight(
  state: unknown,
  preflightPassedAt: unknown,
  mediaReady: boolean,
): boolean {
  switch (state) {
    case "submitted":
    case "accepted-for-marking":
    case "marked":
    case "moderated":
    case "approved":
    case "released":
    case "expired":
    case "voided":
      return false;
    case "assigned":
      return true;
    case "in-progress":
    case "reopened":
      return !preflightPassedAt || !mediaReady;
    default:
      return true;
  }
}
