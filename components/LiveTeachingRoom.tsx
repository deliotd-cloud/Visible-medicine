"use client";

import { useCallback, useState } from "react";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

type Credentials = {
  serverUrl: string;
  participantToken: string;
  roomName: string;
  role: "instructor" | "learner";
  recordingEnabled: false;
};

type LiveTeachingRoomProps = {
  sessionId: string;
  workbookId: string;
  canManage: boolean;
};

async function responseError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return body.error || "The video classroom could not be opened.";
}

export function LiveTeachingRoom(props: LiveTeachingRoomProps) {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reportError = useCallback((message: string) => setError(message), []);

  const join = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/education/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: props.sessionId,
          workbookId: props.workbookId,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      setCredentials((await response.json()) as Credentials);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "The video classroom could not be opened.",
      );
    } finally {
      setBusy(false);
    }
  }, [props.sessionId, props.workbookId]);

  function close() {
    setOpen(false);
    setCredentials(null);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        className="video-classroom-trigger"
        onClick={() => setOpen(true)}
      >
        Video classroom
      </button>
      {open && (
        <section
          className="live-video-drawer"
          aria-label="Elivion live video classroom"
        >
          <header>
            <span>
              <small>Live teaching</small>
              <strong>Video classroom</strong>
            </span>
            <span className="live-video-assurance">
              <i aria-hidden="true" /> Recording disabled
            </span>
            <button type="button" onClick={close} aria-label="Close video classroom">
              ×
            </button>
          </header>
          {!credentials ? (
            <div className="live-video-entry">
              <div className="video-entry-mark" aria-hidden="true">
                <span />
              </div>
              <small>Camera and microphone stay off until you enable them.</small>
              <h2>Join the current teaching room</h2>
              <p>
                Continue viewing the case while speaking with the educator and
                other enrolled learners. Polls and viewer control remain in
                Elivion Education.
              </p>
              {error && <p className="live-video-error" role="alert">{error}</p>}
              <button
                type="button"
                className="live-video-join"
                disabled={busy}
                onClick={() => void join()}
              >
                {busy ? "Preparing secure room…" : "Join video classroom"}
              </button>
              <ul>
                <li>Enrolment-gated access</li>
                <li>Short-lived room token</li>
                <li>No session recording</li>
              </ul>
            </div>
          ) : (
            <LiveKitRoom
              token={credentials.participantToken}
              serverUrl={credentials.serverUrl}
              connect
              audio={false}
              video={false}
              options={{ adaptiveStream: true, dynacast: true }}
              onDisconnected={() => setCredentials(null)}
              onError={(roomError) => setError(roomError.message)}
              data-lk-theme="default"
              className="elivion-livekit-room"
            >
              <VideoClassroomStage
                {...props}
                onError={reportError}
              />
            </LiveKitRoom>
          )}
        </section>
      )}
    </>
  );
}

function VideoClassroomStage({
  canManage,
  onError,
}: LiveTeachingRoomProps & { onError: (message: string) => void }) {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: false },
  );
  const participants = useParticipants();

  return (
    <div className="live-video-stage">
      <div className="live-video-stage-heading">
        <span>
          <i aria-hidden="true" /> Connected
        </span>
        <small>{participants.length} in room · recording disabled</small>
      </div>
      <div className={`live-video-grid${tracks.length ? "" : " empty"}`}>
        {tracks.length ? (
          <GridLayout tracks={tracks}>
            <ParticipantTile />
          </GridLayout>
        ) : (
          <div>
            <strong>Audio classroom connected</strong>
            <p>Enable your camera below or continue with audio alongside the viewer.</p>
          </div>
        )}
      </div>
      <RoomAudioRenderer />
      <ControlBar
        variation="minimal"
        controls={{
          microphone: true,
          camera: true,
          screenShare: canManage,
          chat: false,
          settings: true,
          leave: true,
        }}
        onDeviceError={({ error }) => onError(error.message)}
      />
    </div>
  );
}
