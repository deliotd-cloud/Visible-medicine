// Generate camera-only bounds from existing source vertices; no mesh is written.
import assert from "node:assert/strict";
import { readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { elbowSourceFmaIds } from "../content/elbow-studies.ts";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const raw = await readFile("public/models/bodyparts3d/full-body/catalog.json");
assert.equal(
  hash(raw),
  "109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7",
);
const catalog = JSON.parse(raw),
  entries = catalog.structures.filter((s) =>
    elbowSourceFmaIds.includes(s.fmaId),
  );
assert.equal(entries.length, 8);
assert(entries.every((s) => s.regions.includes("forearm")));
const bundles = catalog.bundles.filter((b) =>
  entries.some((s) => s.bundle === b.id),
);
const geometries = new Map();
for (const b of bundles) {
  const bytes = await readFile("public" + b.url);
  assert.equal(hash(bytes), b.sha256);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  for (const s of entries.filter((s) => s.bundle === b.id)) {
    const node = gltf.scene.getObjectByName(s.nodeName);
    assert(node?.isMesh && node.geometry?.getAttribute("position"));
    assert(node.position.toArray().every((v) => v === 0));
    assert.deepEqual(node.scale.toArray(), [1, 1, 1]);
    assert.deepEqual(node.quaternion.toArray(), [0, 0, 0, 1]);
    geometries.set(s.id, node.geometry.getAttribute("position"));
  }
}
const cameraBounds = {};
for (const side of ["left", "right"]) {
  const sideEntries = entries.filter((s) => s.laterality === side);
  assert.equal(sideEntries.length, 4);
  const muscle = sideEntries.find((s) => s.system === "muscles");
  // Display margins in scene units, not patient/anatomical landmarks or cuts.
  const bottom = muscle.bounds.min[1] - 0.15,
    top = muscle.bounds.max[1] + 0.25;
  const min = [Infinity, bottom, Infinity],
    max = [-Infinity, top, -Infinity];
  for (const s of sideEntries) {
    const p = geometries.get(s.id);
    let count = 0;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < bottom || p.getY(i) > top) continue;
      for (const axis of [0, 2]) {
        const value = axis === 0 ? p.getX(i) : p.getZ(i);
        assert(Number.isFinite(value));
        min[axis] = Math.min(min[axis], value);
        max[axis] = Math.max(max[axis], value);
      }
      count++;
    }
    assert(count > 0, "Every bone/muscle must have actual in-view vertices");
  }
  for (const axis of [0, 2]) {
    min[axis] -= 0.08;
    max[axis] += 0.08;
  }
  assert(min.every((v, i) => Number.isFinite(v) && max[i] > v));
  cameraBounds[side] = { min, max };
}
const pins = {
  sourceCommit: "6c9acd0c0ea1ae10f10f363495d8052242901168",
  sourceVersion: catalog.sourceVersion,
  coordinateSystem: catalog.coordinateSystem,
  bundles,
  entries,
  cameraBounds,
};
const output = JSON.stringify(pins, null, 2) + "\n",
  path = "content/elbow-study-pins.json";
if (process.argv.includes("--check"))
  assert.equal((await readFile(path, "utf8")).replace(/\r\n/g, "\n"), output);
else {
  await assert.rejects(access(path));
  await writeFile(path, output);
}
console.log(
  JSON.stringify({
    sourceSelections: entries.length,
    cameraBounds,
    geometryWritten: false,
    check: process.argv.includes("--check"),
  }),
);
