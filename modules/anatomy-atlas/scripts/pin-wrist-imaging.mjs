import assert from "node:assert/strict";
import { readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  wristImagingGroups,
  wristImagingSelectionNotes,
} from "../content/wrist-imaging-concepts.ts";
import { contentContext } from "./content-contract-tools.mjs";
const raw = await readFile("public/models/bodyparts3d/full-body/catalog.json");
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
assert.equal(
  createHash("sha256").update(raw).digest("hex"),
  "109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7",
);
const catalog = JSON.parse(raw),
  ids = Object.values(wristImagingGroups).flat();
assert.equal(ids.length, 16);
assert.equal(new Set(ids).size, 16);
assert.deepEqual(
  wristImagingSelectionNotes.flatMap((n) => n.fmaIds).sort(),
  [...ids].sort(),
);
const entries = catalog.structures
  .filter((s) => ids.includes(s.fmaId))
  .map((identity) => ({
    identity,
    group: Object.entries(wristImagingGroups).find(([, ids]) =>
      ids.includes(identity.fmaId),
    )[0],
  }));
assert.equal(entries.length, 16);
assert(
  entries.every(
    (e) => e.identity.system === "skeleton" && e.identity.sources.length,
  ),
);
const pins = {
  sourceCommit: "56e9dc9e0e16f6cfbf3087a5af01aefde50e30d1",
  sourceVersion: catalog.sourceVersion,
  coordinateSystem: catalog.coordinateSystem,
  bundles: catalog.bundles.filter((b) =>
    entries.some((e) => e.identity.bundle === b.id),
  ),
  entries,
};
const path = "content/wrist-imaging-pins.json",
  output = JSON.stringify(pins, null, 2) + "\n";
if (process.argv.includes("--check"))
  assert.equal((await readFile(path, "utf8")).replace(/\r\n/g, "\n"), output);
else {
  const { api } = await contentContext(),
    tabs = ["ct", "mri", "xray"];
  const before = {
    sourceCommit: pins.sourceCommit,
    allLessonsAndRecipesHash: hash({
      body: catalog.structures.map((s) => ({
        id: s.id,
        sections: Object.fromEntries(
          api.contentTabs.map((t) => [t, api.bodyLesson(s, t)]),
        ),
      })),
      shoulder: api.structures,
      recipes: api.dissectionProfiles,
    }),
    tabs,
    entries: entries.map((e) => ({
      ...e,
      sections: Object.fromEntries(
        tabs.map((t) => {
          const lesson = api.bodyLesson(e.identity, t);
          assert.equal(lesson.readiness, "pending");
          return [t, lesson];
        }),
      ),
    })),
  };
  for (const file of [path, "content/wrist-imaging.before.json"])
    await assert.rejects(
      access(file),
      "Never implicitly overwrite admission or teaching history",
    );
  await writeFile(path, output);
  await writeFile(
    "content/wrist-imaging.before.json",
    JSON.stringify(before, null, 2) + "\n",
  );
}
console.log(
  JSON.stringify({
    selections: entries.length,
    groups: 5,
    check: process.argv.includes("--check"),
  }),
);
