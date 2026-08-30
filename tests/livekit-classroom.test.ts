import assert from "node:assert/strict";
import test from "node:test";

import {
  LIVEKIT_RECORDING_ENABLED,
  liveKitClassroomRole,
  liveKitPublishSources,
  liveKitRoomName,
  normalizeLiveKitServerUrl,
} from "../lib/livekit-classroom-policy.ts";

test("live classrooms remain recording-free", () => {
  assert.equal(LIVEKIT_RECORDING_ENABLED, false);
});

test("learners cannot publish screen-share tracks", () => {
  assert.deepEqual(liveKitPublishSources(liveKitClassroomRole(false)), [
    "camera",
    "microphone",
  ]);
  assert.deepEqual(liveKitPublishSources(liveKitClassroomRole(true)), [
    "camera",
    "microphone",
    "screen_share",
    "screen_share_audio",
  ]);
});

test("room identifiers are bounded to the random teaching session", () => {
  assert.equal(
    liveKitRoomName("87BB403E-91DD-4A14-A86A-4871778BA7A7"),
    "visible-medicine-87bb403e-91dd-4a14-a86a-4871778ba7a7",
  );
  assert.throws(() => liveKitRoomName("%%%"));
});

test("production accepts only secure LiveKit websocket endpoints", () => {
  assert.equal(
    normalizeLiveKitServerUrl("wss://example.livekit.cloud/", true),
    "wss://example.livekit.cloud",
  );
  assert.throws(() => normalizeLiveKitServerUrl("ws://example.test", true));
  assert.equal(
    normalizeLiveKitServerUrl("ws://localhost:7880", false),
    "ws://localhost:7880",
  );
});
