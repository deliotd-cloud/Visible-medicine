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
      "Protected Education scan delivery is not connected yet. Demonstration metadata does not confirm usable assessment images.",
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
