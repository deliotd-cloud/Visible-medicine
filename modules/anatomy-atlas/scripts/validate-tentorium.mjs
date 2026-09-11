import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { build } from "./workspace-test-build.mjs";
const compiled = await build({
  stdin: {
    contents:
      "export * from './lib/tentorium'; export * from './lib/body-display-catalog'; export * from './app/dissection-data'; export * from './lib/study-links'; export * from './lib/study-library'; export * from './lib/anatomy-link-registry'; export * from './lib/anatomy-coordinates'; export {bodyLesson} from './app/body-content';",
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const a = await import(
  "data:text/javascript;base64," +
    Buffer.from(compiled.outputFiles[0].text).toString("base64")
);
const raw = JSON.parse(
    await readFile("public/models/bodyparts3d/full-body/catalog.json"),
  ),
  pins = JSON.parse(
    await readFile("public/models/bodyparts3d/tentorium/catalog.json"),
  );
const before = JSON.stringify(raw),
  catalog = a.bodyDisplayCatalog(raw),
  s = catalog.structures.find((s) => s.fmaId === "FMA83966");
assert.equal(catalog.structures.length, 1025);
assert.equal(JSON.stringify(raw), before);
assert.equal(a.bodyDisplayCatalog(catalog), catalog);
assert.deepEqual(s, pins.structures[0]);
assert.equal(s.representation.coverage, "partial");
assert.equal(s.representation.sourceLaterality, "unspecified");
assert.equal(s.laterality, "right");
assert.match(s.name, /right-sided source only/);
let rejections = 0;
const reject = (fn) => {
  const bad = structuredClone(catalog);
  fn(bad);
  assert.throws(() => a.addTentorium(bad));
  rejections++;
};
for (const p of [...pins.contextRecords, s]) {
  reject((c) => {
    c.structures = c.structures.filter((s) => s.id !== p.id);
  });
  reject((c) => c.structures.push(structuredClone(p)));
  for (const field of [
    "id",
    "fmaId",
    "name",
    "laterality",
    "bundle",
    "nodeName",
  ])
    reject((c) => {
      c.structures.find((s) => s.id === p.id)[field] = "changed";
    });
  reject((c) => {
    c.structures.find((s) => s.id === p.id).anchor[0] += 0.1;
  });
  reject((c) => {
    c.structures.find((s) => s.id === p.id).sources[0].sha256 = "changed";
  });
}
reject((c) => {
  delete c.structures.find((p) => p.id === s.id).representation;
});
for (const b of [...pins.contextBundles, ...pins.bundles]) {
  reject((c) => {
    c.bundles = c.bundles.filter((p) => p.id !== b.id);
  });
  reject((c) => c.bundles.push(structuredClone(b)));
  reject((c) => {
    c.bundles.find((p) => p.id === b.id).sha256 = "changed";
  });
}
for (const k of ["sourceVersion", "license", "coordinateSystem"])
  reject((c) => {
    c[k] = "changed";
  });
const detached = a.addTentorium(raw);
detached.structures.at(-1).representation.coverage = "complete";
assert.equal(
  a.addTentorium(raw).structures.at(-1).representation.coverage,
  "partial",
);
const bytes = await readFile(
  "public/models/bodyparts3d/tentorium/tentorium.glb",
);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  pins.bundles[0].sha256,
);
const loaded = (
    await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    )
  ).scene,
  meshes = [];
loaded.traverse((o) => {
  if (o.isMesh) meshes.push(o);
});
assert.equal(meshes.length, 1);
const mesh = meshes[0];
assert.equal(mesh.name, s.nodeName);
assert.equal(mesh.geometry.index.count / 3, 21924);
assert.equal(mesh.userData.coverage, "partial-right-source");
const pos = mesh.geometry.attributes.position.array,
  points = Array.from({ length: pos.length / 3 }, (_, i) =>
    Array.from(pos.slice(i * 3, i * 3 + 3)),
  );
assert(points.every((p) => p[0] < 0));
assert(points.some((p) => JSON.stringify(p) === JSON.stringify(s.anchor)));
let links = 0,
  plans = 0;
for (const region of ["head-neck", "whole-body"])
  for (const side of ["both", "right", "left"]) {
    const scope = a.bodyStudyScope(catalog, region, side),
      profile = a.dissectionProfiles[region],
      key = "focus:tentorium-source",
      recipe = a
        .studyLibrary(scope, profile)
        .flatMap((card) => card.recipes)
        .find((item) => item.key === key);
    assert(recipe);
    assert.equal(recipe.available, side !== "left");
    assert.equal(a.studyLibraryAction(scope, profile, key, true), null);
    assert.deepEqual(
      a.studyLibraryAction(scope, profile, key, false),
      side === "left" ? null : { kind: "focus", id: "tentorium-source" },
    );
    const href = a.makeStudyLink(
      catalog,
      region,
      s.id,
      side,
      "tentorium-source",
    );
    if (side === "left") {
      assert.equal(href, null);
      assert(
        !a.bodyStudyScope(catalog, region, side).some((p) => p.id === s.id),
      );
      continue;
    }
    assert(href);
    links++;
    const url = new URL(href, "https://atlas.invalid");
    const resolved = a.resolveStudyLink(
      catalog,
      region,
      a.parseStudyLink(Object.fromEntries(url.searchParams)),
    );
    assert.equal(resolved.status, "ready");
    const visible = a.stageStructures(
      scope,
      profile,
      "assembled",
      "tentorium-source",
    );
    assert.deepEqual(
      new Set(visible.map((s) => s.fmaId)),
      new Set(["FMA83966", "FMA52735", "FMA52738", "FMA52736"]),
    );
    assert(!visible.some((s) => s.fmaId === "FMA50801"));
    // Use the actual source-bound link visibility as one reversible user operation.
    const plan = {
      type: "load-view",
      hiddenIds: scope
        .filter((p) => !resolved.visibleIds.includes(p.id))
        .map((p) => p.id),
    };
    const applied = a.dissectionReducer(a.initialDissection, plan);
    plans++;
    assert.deepEqual(
      a.resolveDissection(scope, profile, applied).visible.map((s) => s.id),
      resolved.visibleIds,
    );
    const removed = a.dissectionReducer(applied, { type: "remove", id: s.id });
    assert(
      !a
        .resolveDissection(scope, profile, removed)
        .visible.some((p) => p.id === s.id),
    );
    assert.deepEqual(
      a.dissectionReducer(a.dissectionReducer(removed, { type: "undo" }), {
        type: "redo",
      }),
      removed,
    );
  }
for (const tab of ["anatomy", "function"]) {
  const lesson = a.bodyLesson(s, tab);
  assert.equal(lesson.readiness, "draft");
  assert.match(JSON.stringify(lesson), /right-sided|Right/);
}
for (const tab of ["ct", "mri", "xray", "ultrasound", "clinical", "pathology"])
  assert.equal(a.bodyLesson(s, tab).readiness, "pending");
assert.equal(
  a.tentoriumLesson({ ...s, laterality: "left" }, "anatomy"),
  undefined,
);
const entry = a.bodyLinkEntries(catalog).find((p) => p.id === s.id);
assert(entry);
assert.equal(entry.id, s.id);
assert.deepEqual(entry.sources, s.sources);
assert(!("frameOfReferenceUid" in entry.reference));
const point = a
  .referenceTransform(catalog.coordinateSystem)
  .toScene(entry.reference.point);
point.forEach((v, i) => assert(Math.abs(v - s.center[i]) < 1e-8));
console.log(
  JSON.stringify({
    displaySelections: 1025,
    newSurfaces: 1,
    triangles: 21924,
    coverage: "partial-right-source",
    links,
    plans,
    rejections,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
