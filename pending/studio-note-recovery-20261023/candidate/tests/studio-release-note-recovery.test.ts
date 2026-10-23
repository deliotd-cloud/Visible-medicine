import assert from "node:assert/strict";
import test from "node:test";
import {
  dropUnsentReleaseNotes,
  readUnsentReleaseNotes,
  releaseNoteRecoveryKey,
  retainUnsentReleaseNotes,
} from "../lib/studio-release-note-recovery.ts";

const scope = { actorId: "edu:reviewer-1", organizationId: "school-1" };
const revision = "a".repeat(64);
const binding = (overrides: unknown[] = []) => JSON.stringify([
  "release-1", 2, "in-review", revision, false, false, ...overrides,
]);
const key = releaseNoteRecoveryKey(scope, binding())!;

test("key binds only a complete canonical reviewable release and scoped actor", () => {
  assert.equal(key, JSON.stringify([
    "studio-release-notes-v1", scope.actorId, scope.organizationId,
    "release-1", 2, "in-review", revision, false, false,
  ]));
  assert.equal(releaseNoteRecoveryKey(scope, JSON.stringify(["release-1", 2, "approved", revision, true, false])) !== null, true);
  for (const invalid of [
    ["release-1", 2, "draft", revision, false, false],
    ["release-1", 2, "approved", revision, true, true],
    ["release-1", 0, "in-review", revision, false, false],
    ["release-1", 1.5, "in-review", revision, false, false],
    ["release-1", Number.MAX_SAFE_INTEGER + 1, "in-review", revision, false, false],
    ["", 2, "in-review", revision, false, false],
    ["x".repeat(201), 2, "in-review", revision, false, false],
    [" release-1", 2, "in-review", revision, false, false],
    ["release-1", 2, "in-review", revision.toUpperCase(), false, false],
    ["release-1", 2, "in-review", revision, 1, false],
    ["release-1", 2, "in-review", revision, false],
    ["release-1", 2, "in-review", revision, false, false, "foreign"],
  ]) assert.equal(releaseNoteRecoveryKey(scope, JSON.stringify(invalid)), null);
  assert.equal(releaseNoteRecoveryKey(scope, " [\"release-1\",2,\"in-review\",\"" + revision + "\",false,false]"), null);
  for (const invalid of [undefined, { actorId: "reviewer-1", organizationId: "school-1" },
    { actorId: "edu:", organizationId: "school-1" },
    { actorId: "edu:a\n", organizationId: "school-1" },
    { actorId: "edu:a", organizationId: " school-1" },
    { actorId: "edu:a", organizationId: "x".repeat(257) }]) {
    assert.equal(releaseNoteRecoveryKey(invalid, binding()), null);
  }
});

test("same owner retains frozen notes by exact key and reference, with no decision authority", () => {
  const documentA = {}, documentB = {};
  assert.equal(readUnsentReleaseNotes(documentA, key), null);
  const first = retainUnsentReleaseNotes(documentA, key, null, "Clinical notes", false)!;
  assert.deepEqual(Object.keys(first), ["key", "notes", "uncertain"]);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(readUnsentReleaseNotes(documentA, key), first);
  assert.equal(readUnsentReleaseNotes(documentB, key), null);
  assert.equal(retainUnsentReleaseNotes(documentA, key, null, "stale", false), null);
  const second = retainUnsentReleaseNotes(documentA, key, first, "Revised notes", true)!;
  assert.equal(readUnsentReleaseNotes(documentA, key), second);
  assert.equal(dropUnsentReleaseNotes(documentA, key, first), false);
  assert.equal(dropUnsentReleaseNotes(documentA, key, null), false);
  assert.equal(dropUnsentReleaseNotes(documentA, key, second), true);
  assert.equal(readUnsentReleaseNotes(documentA, key), null);
  assert.equal(dropUnsentReleaseNotes(documentA, key, second), false);
});

test("empty text is only an explicit uncertain marker and length is UTF-16 bounded", () => {
  const owner = {};
  assert.equal(retainUnsentReleaseNotes(owner, key, null, "", false), null);
  assert.equal(retainUnsentReleaseNotes(owner, key, null, "a".repeat(2001), false), null);
  assert.equal(retainUnsentReleaseNotes(owner, key, null, "🙂".repeat(1001), true), null);
  const marker = retainUnsentReleaseNotes(owner, key, null, "", true)!;
  assert.equal(marker.uncertain, true);
  const maximum = retainUnsentReleaseNotes(owner, key, marker, "🙂".repeat(1000), false)!;
  assert.equal(maximum.notes.length, 2000);
});

test("capacity refuses ninth entry without evicting another release", () => {
  const owner = {};
  const saved = Array.from({ length: 8 }, (_, index) => {
    const nextKey = releaseNoteRecoveryKey(scope, JSON.stringify([
      `release-${index}`, 2, "in-review", revision, false, false,
    ]))!;
    return retainUnsentReleaseNotes(owner, nextKey, null, "n".repeat(2000), false)!;
  });
  const ninthKey = releaseNoteRecoveryKey(scope, JSON.stringify(["release-9", 2, "in-review", revision, false, false]))!;
  assert.equal(retainUnsentReleaseNotes(owner, ninthKey, null, "n", false), null);
  for (const entry of saved) assert.equal(readUnsentReleaseNotes(owner, entry.key), entry);
  assert.equal(dropUnsentReleaseNotes(owner, saved[0].key, saved[0]), true);
  assert.ok(retainUnsentReleaseNotes(owner, ninthKey, null, "n", false));
});

test("read and mutation reject foreign or widened keys and owners", () => {
  const owner = {};
  const saved = retainUnsentReleaseNotes(owner, key, null, "n", false)!;
  const foreign = [
    JSON.stringify(["v1", scope.actorId, scope.organizationId, "release-1"]),
    JSON.stringify([...JSON.parse(key), "decision"]),
    JSON.stringify(["studio-release-notes-v1", ...JSON.parse(key).slice(1, 8)]),
    ` ${key}`,
    key.replace("in-review", "published"),
  ];
  for (const otherKey of foreign) {
    assert.equal(readUnsentReleaseNotes(owner, otherKey), null);
    assert.equal(retainUnsentReleaseNotes(owner, otherKey, null, "n", false), null);
    assert.equal(dropUnsentReleaseNotes(owner, otherKey, saved), false);
  }
  assert.equal(readUnsentReleaseNotes(null as unknown as object, key), null);
  assert.equal(retainUnsentReleaseNotes(null as unknown as object, key, null, "n", false), null);
  assert.equal(dropUnsentReleaseNotes(null as unknown as object, key, saved), false);
  assert.equal(readUnsentReleaseNotes(owner, key), saved);
});
