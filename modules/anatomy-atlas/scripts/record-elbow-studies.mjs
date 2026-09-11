import assert from "node:assert/strict";
import { writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dissectionProfiles } from "../app/dissection-data.ts";
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
const ids = [
  "elbow-bones",
  "elbow-humeroulnar",
  "elbow-radiocapitellar",
  "elbow-proximal-radioulnar",
  "elbow-supinator",
];
const previous = structuredClone(dissectionProfiles),
  forearm = previous.forearm;
const addition = {
  stages: forearm.stages.filter((s) => ids.includes(s.id)),
  focuses: forearm.focuses.filter((s) => ids.includes(s.id)),
  references: forearm.references.slice(-2),
};
assert.equal(addition.stages.length, 5);
assert.equal(addition.focuses.length, 5);
forearm.stages = forearm.stages.filter((s) => !ids.includes(s.id));
forearm.focuses = forearm.focuses.filter((s) => !ids.includes(s.id));
forearm.references = forearm.references.slice(0, -2);
assert.equal(
  hash(previous),
  "dc6ea9198a24ac28e02df8729d9d06543eada6786a6ebd2d6b139f626043a4be",
);
const record = {
  sourceCommit: "6c9acd0c0ea1ae10f10f363495d8052242901168",
  ids,
  before: hash(previous),
  after: hash(dissectionProfiles),
  addition: hash(addition),
};
const path = "content/elbow-study-transition.json";
await assert.rejects(access(path));
await writeFile(path, JSON.stringify(record, null, 2) + "\n");
console.log(JSON.stringify({ ...record, recordHash: hash(record) }));
