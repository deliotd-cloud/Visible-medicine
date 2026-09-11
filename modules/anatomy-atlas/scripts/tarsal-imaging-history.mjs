// Exact offline reconstruction for older curriculum tests; never runtime or approval data.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import pins from "../content/tarsal-imaging-pins.json" with { type: "json" };
import after from "../content/tarsal-imaging.transition.json" with { type: "json" };
export const tarsalContentHash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
export function authoringBeforeTarsalImaging({ api, catalog }) {
  assert.equal(
    tarsalContentHash(pins),
    "861029223e9591204f22099de2513f68d5e30984e9d45851465fd27fac3a6f61",
  );
  assert.equal(
    tarsalContentHash(after),
    "449c15c4f2321ef8851b86d610607da591cf81d7c8cbd5af85e990ede6d16699",
  );
  assert.equal(after.sourceCommit, pins.sourceCommit);
  const prior = new Map();
  for (const [i, e] of pins.entries.entries()) {
    assert.deepEqual(
      catalog.structures.find((s) => s.id === e.identity.id),
      e.identity,
    );
    assert.equal(after.entries[i].id, e.identity.id);
    for (const tab of pins.tabs) {
      assert.equal(e.previous[tab].readiness, "pending");
      assert.equal(
        tarsalContentHash(api.bodyLesson(e.identity, tab)),
        after.entries[i].sections[tab],
        "Unrecorded tarsal teaching change",
      );
      prior.set(e.identity.id + "|" + tab, {
        identity: e.identity,
        lesson: e.previous[tab],
      });
    }
  }
  assert.equal(prior.size, 42);
  const bodyLesson = (s, tab) => {
    const e = prior.get(s.id + "|" + tab);
    if (!e) return api.bodyLesson(s, tab);
    assert.deepEqual(s, e.identity);
    return structuredClone(e.lesson);
  };
  return {
    ...api,
    bodyLesson,
    bodyContent(s, tab) {
      const { readiness: _r, ...section } = bodyLesson(s, tab);
      return section;
    },
  };
}
