import { safeText } from "@/lib/domain";

export type TeachingViewerState = {
  activeSeries: string;
  frameIndex: number;
  zoom: number;
  mixedAsset: "radiology" | "pathology";
  activePlane: "axial" | "coronal" | "sagittal";
  triPlanar: boolean;
};

export type TeachingSessionView = {
  id: string;
  workbookId: string;
  instructorId: string;
  state: "live" | "ended";
  activeCaseId: string;
  viewerState: TeachingViewerState;
  activeSceneIndex: number | null;
  version: number;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  participantCount: number;
  followingCount: number;
};

export type TeachingSessionBundle = {
  session: TeachingSessionView | null;
  participant: null | {
    followState: "following" | "exploring";
    currentCaseId: string;
    lastSeenAt: string;
  };
  permissions: { manage: boolean; follow: boolean };
  refreshedAt: string;
};

export class TeachingSessionValidationError extends Error {}

function record(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TeachingSessionValidationError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
) {
  const unsupported = Object.keys(value).find((key) => !allowed.includes(key));
  if (unsupported)
    throw new TeachingSessionValidationError(
      `${label} contains unsupported field ${unsupported}.`,
    );
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum)
    throw new TeachingSessionValidationError(
      `${label} is outside its allowed range.`,
    );
  return number;
}

export function validateTeachingViewerState(
  value: unknown,
): TeachingViewerState {
  const state = record(value, "viewerState");
  exactKeys(
    state,
    [
      "activeSeries",
      "frameIndex",
      "zoom",
      "mixedAsset",
      "activePlane",
      "triPlanar",
    ],
    "viewerState",
  );
  const mixedAsset =
    state.mixedAsset === "radiology" || state.mixedAsset === "pathology"
      ? state.mixedAsset
      : null;
  const activePlane =
    state.activePlane === "axial" ||
    state.activePlane === "coronal" ||
    state.activePlane === "sagittal"
      ? state.activePlane
      : null;
  if (!mixedAsset || !activePlane)
    throw new TeachingSessionValidationError(
      "Viewer modality and plane must use supported education values.",
    );
  if (typeof state.triPlanar !== "boolean")
    throw new TeachingSessionValidationError("triPlanar must be a boolean.");
  return {
    activeSeries: safeText(state.activeSeries, 160),
    frameIndex: Math.round(
      boundedNumber(state.frameIndex, 0, 100_000, "frameIndex"),
    ),
    zoom: boundedNumber(state.zoom, 1, 500, "zoom"),
    mixedAsset,
    activePlane,
    triPlanar: state.triPlanar,
  };
}

export function canManageTeachingSessions(roles: readonly string[]) {
  return roles.includes("instructor") || roles.includes("administrator");
}

export function canFollowTeachingSessions(roles: readonly string[]) {
  return roles.includes("learner");
}
