export const LIVEKIT_RECORDING_ENABLED = false;

export type LiveKitClassroomRole = "instructor" | "learner";
export type LiveKitPublishSource =
  | "camera"
  | "microphone"
  | "screen_share"
  | "screen_share_audio";

export function liveKitClassroomRole(manage: boolean): LiveKitClassroomRole {
  return manage ? "instructor" : "learner";
}

export function liveKitPublishSources(
  role: LiveKitClassroomRole,
): LiveKitPublishSource[] {
  return role === "instructor"
    ? ["camera", "microphone", "screen_share", "screen_share_audio"]
    : ["camera", "microphone"];
}

export function liveKitRoomName(sessionId: string) {
  const safeId = sessionId.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!safeId) throw new Error("A valid teaching session identifier is required.");
  return `elivion-education-${safeId}`;
}

export function normalizeLiveKitServerUrl(value: string, production: boolean) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("The LiveKit server URL is invalid.");
  }
  const allowed = production
    ? url.protocol === "wss:"
    : url.protocol === "wss:" || url.protocol === "ws:";
  if (!allowed)
    throw new Error(
      production
        ? "The LiveKit server URL must use wss://."
        : "The LiveKit server URL must use ws:// or wss://.",
    );
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}
