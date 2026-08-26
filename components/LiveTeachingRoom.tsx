"use client";

import "@livekit/components-styles";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  StartAudio,
  useConnectionState,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";

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

function initialVideoPanelOpen() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("video") === "1";
}

export function LiveTeachingRoom(props: LiveTeachingRoomProps) {
  const [open, setOpen] = useState(initialVideoPanelOpen);
  const [minimized, setMinimized] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [microphoneOnJoin, setMicrophoneOnJoin] = useState(false);
  const [cameraOnJoin, setCameraOnJoin] = useState(false);
  const [copyState, setCopyState] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mediaSupported =
    typeof navigator === "undefined" || Boolean(navigator.mediaDevices);
  const reportError = useCallback((message: string) => setError(message), []);

  useEffect(() => {
    if (open && !minimized && !credentials) closeButtonRef.current?.focus();
  }, [credentials, minimized, open]);

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
      setMinimized(false);
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
    setMinimized(false);
    setCredentials(null);
    setCopyState("");
    setError("");
  }

  async function copyTeachingLink() {
    try {
      if (!navigator.clipboard)
        throw new Error("Copy is unavailable in this browser.");
      const teachingUrl = new URL(window.location.href);
      teachingUrl.searchParams.set("view", "teaching");
      teachingUrl.searchParams.set("video", "1");
      await navigator.clipboard.writeText(teachingUrl.toString());
      setCopyState("Teaching link copied");
    } catch (copyError) {
      setError(
        copyError instanceof Error
          ? copyError.message
          : "The teaching link could not be copied.",
      );
    }
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
          className={`live-video-drawer${minimized ? " minimized" : ""}`}
          role="dialog"
          aria-modal="false"
          aria-label="Elivion live video classroom"
        >
          <header>
            <span>
              <small>Live teaching</small>
              <strong>{minimized ? "Classroom connected" : "Video classroom"}</strong>
            </span>
            <span className="live-video-assurance">
              <i aria-hidden="true" /> {credentials ? "Connected · " : ""}Recording disabled
            </span>
            {credentials && (
              <button
                type="button"
                className="live-video-minimize"
                onClick={() => setMinimized((value) => !value)}
                aria-label={minimized ? "Open video classroom" : "Minimise video classroom"}
                aria-expanded={!minimized}
                title={minimized ? "Open classroom" : "Keep listening while viewing the case"}
              >
                {minimized ? "Open" : "Minimise"}
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              className="live-video-close"
              onClick={close}
              aria-label={credentials ? "Leave video classroom" : "Close video classroom"}
            >
              {credentials ? "Leave" : "×"}
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
              <fieldset className="live-video-preferences" disabled={!mediaSupported}>
                <legend>Join preferences</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={microphoneOnJoin}
                    onChange={(event) => setMicrophoneOnJoin(event.target.checked)}
                  />
                  <span><b>Microphone</b> {microphoneOnJoin ? "on when you join" : "off when you join"}</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={cameraOnJoin}
                    onChange={(event) => setCameraOnJoin(event.target.checked)}
                  />
                  <span><b>Camera</b> {cameraOnJoin ? "on when you join" : "off when you join"}</span>
                </label>
              </fieldset>
              {!mediaSupported && (
                <p className="live-video-device-note">This browser can join to listen, but it does not expose camera or microphone controls.</p>
              )}
              {error && <p className="live-video-error" role="alert">{error}</p>}
              <div className="live-video-entry-actions">
                <button
                  type="button"
                  className="live-video-join"
                  disabled={busy}
                  onClick={() => void join()}
                >
                  {busy ? "Preparing secure room…" : "Join video classroom"}
                </button>
                {props.canManage && (
                  <button type="button" className="live-video-copy" onClick={() => void copyTeachingLink()}>
                    {copyState || "Copy learner link"}
                  </button>
                )}
              </div>
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
              audio={microphoneOnJoin}
              video={cameraOnJoin}
              options={{ adaptiveStream: true, dynacast: true }}
              onDisconnected={() => {
                setCredentials(null);
                setMinimized(false);
              }}
              onError={(roomError) => setError(roomError.message)}
              data-lk-theme="default"
              className="elivion-livekit-room"
              aria-hidden={minimized}
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
  const connectionState = useConnectionState();
  const connectionLabel =
    connectionState === ConnectionState.Connected
      ? "Connected"
      : connectionState === ConnectionState.Reconnecting
        ? "Reconnecting"
        : connectionState === ConnectionState.Connecting
          ? "Connecting"
          : "Disconnected";

  return (
    <div className="live-video-stage">
      <div className={`live-video-stage-heading ${connectionState}`} aria-live="polite">
        <span>
          <i aria-hidden="true" /> {connectionLabel}
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
      <StartAudio className="live-video-start-audio" label="Allow classroom audio" />
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
