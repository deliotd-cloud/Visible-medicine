import { AccessToken, TrackSource } from "livekit-server-sdk";
import type { AuthContext } from "@/lib/auth";
import { appendAudit } from "@/db/bootstrap";
import { EducationApiError } from "@/lib/education-api";
import { safeText } from "@/lib/domain";
import { getTeachingSessionBundle } from "@/lib/teaching-session-repository";
import {
  LIVEKIT_RECORDING_ENABLED,
  liveKitClassroomRole,
  liveKitPublishSources,
  liveKitRoomName,
  normalizeLiveKitServerUrl,
  type LiveKitPublishSource,
} from "@/lib/livekit-classroom-policy";

export type LiveKitClassroomCredentials = {
  serverUrl: string;
  participantToken: string;
  roomName: string;
  role: "instructor" | "learner";
  recordingEnabled: false;
};

function exactKeys(payload: Record<string, unknown>, allowed: readonly string[]) {
  const unsupported = Object.keys(payload).find((key) => !allowed.includes(key));
  if (unsupported)
    throw new EducationApiError(`Unsupported field ${unsupported}.`, 422);
}

function trackSource(source: LiveKitPublishSource) {
  if (source === "camera") return TrackSource.CAMERA;
  if (source === "microphone") return TrackSource.MICROPHONE;
  if (source === "screen_share") return TrackSource.SCREEN_SHARE;
  return TrackSource.SCREEN_SHARE_AUDIO;
}

function liveKitConfiguration() {
  const serverUrl = process.env.LIVEKIT_URL?.trim() ?? "";
  const apiKey = process.env.LIVEKIT_API_KEY?.trim() ?? "";
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim() ?? "";
  if (!serverUrl || !apiKey || !apiSecret)
    throw new EducationApiError(
      "Live video is prepared but not yet connected to the Visible Medicine LiveKit Cloud project.",
      503,
    );
  try {
    return {
      serverUrl: normalizeLiveKitServerUrl(
        serverUrl,
        process.env.NODE_ENV === "production",
      ),
      apiKey,
      apiSecret,
    };
  } catch (error) {
    throw new EducationApiError(
      error instanceof Error
        ? error.message
        : "The LiveKit server configuration is invalid.",
      503,
    );
  }
}

export async function issueLiveKitClassroomCredentials(
  auth: AuthContext,
  payload: Record<string, unknown>,
): Promise<LiveKitClassroomCredentials> {
  exactKeys(payload, ["sessionId", "workbookId"]);
  const sessionId = safeText(payload.sessionId, 100);
  const workbookId = safeText(payload.workbookId, 100);
  if (!sessionId || !workbookId)
    throw new EducationApiError(
      "A live teaching session and workbook are required.",
      422,
    );

  const bundle = await getTeachingSessionBundle(auth, workbookId);
  if (!bundle.session || bundle.session.id !== sessionId)
    throw new EducationApiError(
      "This live video classroom is no longer available.",
      404,
    );
  if (!bundle.permissions.manage && !bundle.permissions.follow)
    throw new EducationApiError(
      "An instructor role or active learner allocation is required to join this classroom.",
      403,
    );

  const configuration = liveKitConfiguration();
  const role = liveKitClassroomRole(bundle.permissions.manage);
  const roomName = liveKitRoomName(bundle.session.id);
  const token = new AccessToken(configuration.apiKey, configuration.apiSecret, {
    identity: auth.userId,
    name: auth.displayName,
    ttl: "2h",
    metadata: JSON.stringify({ role, workbookId }),
    attributes: {
      "elivion.education.role": role,
      "elivion.education.workbook": workbookId,
    },
  });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    roomAdmin: false,
    roomRecord: LIVEKIT_RECORDING_ENABLED,
    canPublish: true,
    canPublishSources: liveKitPublishSources(role).map(trackSource),
    canSubscribe: true,
    canPublishData: false,
  });

  const participantToken = await token.toJwt();
  await appendAudit(
    auth.userId,
    "teaching-session.video-token-issued",
    "teaching-session",
    sessionId,
    "success",
    `workbook=${workbookId};role=${role};recording=disabled`,
  );
  return {
    serverUrl: configuration.serverUrl,
    participantToken,
    roomName,
    role,
    recordingEnabled: LIVEKIT_RECORDING_ENABLED,
  };
}
