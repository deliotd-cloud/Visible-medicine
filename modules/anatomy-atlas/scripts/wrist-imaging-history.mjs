// Offline, exact teaching-history reconstruction; never runtime content or approvals.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { preElbowRecipeProfiles } from './elbow-study-history.mjs';
import { authoringBeforeTarsalImaging } from './tarsal-imaging-history.mjs';
import before from "../content/wrist-imaging.before.json" with { type: "json" };
import after from "../content/wrist-imaging.transition.json" with { type: "json" };
import pins from "../content/wrist-imaging-pins.json" with { type: "json" };
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
export function authoringBeforeWristImaging({ api, catalog }) {
  api = authoringBeforeTarsalImaging({ api, catalog });
  assert.equal(
    hash(before),
    "6503f2a45ef89001cf485ad5a0397606f2bcd2616593c958e347da69ed606c3c",
  );
  assert.equal(
    hash(after),
    "916ff46a96c43f2d2a67d69ce140b2c027e1cc9595276d1a4ebeaf350a7f0e7a",
  );
  assert.equal(
    hash(pins),
    "318ca7e848669adbbde6b5c3f2092dc750f346c5412db0558a8b68abe6efe878",
  );
  assert.equal(before.sourceCommit, "56e9dc9e0e16f6cfbf3087a5af01aefde50e30d1");
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(pins.sourceCommit, before.sourceCommit);
  assert.deepEqual(before.tabs, ["ct", "mri", "xray"]);
  assert.deepEqual(
    before.entries.map(({ identity, group }) => ({ identity, group })),
    pins.entries,
  );
  assert.deepEqual(
    after.entries.map((e) => e.id),
    pins.entries.map((e) => e.identity.id),
  );
  const original = new Map();
  for (const [i, e] of before.entries.entries()) {
    assert.deepEqual(
      catalog.structures.find((s) => s.id === e.identity.id),
      e.identity,
    );
    assert.deepEqual(Object.keys(e.sections), before.tabs);
    assert.deepEqual(Object.keys(after.entries[i].sections), before.tabs);
    for (const tab of before.tabs) {
      assert.equal(e.sections[tab].readiness, "pending");
      assert.equal(
        hash(api.bodyLesson(e.identity, tab)),
        after.entries[i].sections[tab],
        "Unrecorded wrist teaching change",
      );
      original.set(e.identity.id + "|" + tab, {
        identity: e.identity,
        lesson: e.sections[tab],
      });
    }
  }
  assert.equal(original.size, 48);
  const bodyLesson = (s, tab) => {
    const e = original.get(s.id + "|" + tab);
    if (!e) return api.bodyLesson(s, tab);
    assert.deepEqual(s, e.identity);
    return structuredClone(e.lesson);
  };
  const bodyContent = (s, tab) => {
    const { readiness: _r, ...shown } = bodyLesson(s, tab);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent, dissectionProfiles: preElbowRecipeProfiles(api.dissectionProfiles) };
}
