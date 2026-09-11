import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";
import { elbowStudySets } from "../content/elbow-studies.ts";
import { elbowStudyBounds } from "../lib/elbow-studies.ts";
import { closeUpLabelAnchor } from "../lib/close-up-labels.ts";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  dissectionProfiles,
  stageStructures,
  initialDissection,
  dissectionReducer,
  resolveDissection,
} from "../app/dissection-data.ts";
import { studyLibrary, filterStudyLibrary } from "../lib/study-library.ts";
import {
  makeStudyLink,
  parseStudyLink,
  resolveStudyLink,
} from "../lib/study-links.ts";
import {
  preElbowRecipeProfiles,
  elbowStudyProfilesHash,
} from "./elbow-study-history.mjs";
const hash = (value) => createHash("sha256").update(value).digest("hex");
let checks = 0,
  links = 0,
  labelChecks = 0,
  rejectionChecks = 0;
const same = (a, b, note) => {
  checks++;
  assert.deepEqual(a, b, note);
};
const raw = await readFile("public/models/bodyparts3d/full-body/catalog.json");
same(
  hash(raw),
  "109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7",
);
const catalog = JSON.parse(raw),
  original = JSON.stringify(catalog),
  profile = dissectionProfiles.forearm;
same(hash(JSON.stringify(dissectionProfiles)), elbowStudyProfilesHash);
same(
  hash(JSON.stringify(preElbowRecipeProfiles(dissectionProfiles))),
  "dc6ea9198a24ac28e02df8729d9d06543eada6786a6ebd2d6b139f626043a4be",
);
const changedRecipes = structuredClone(dissectionProfiles);
changedRecipes.hand.title += "unrelated";
assert.throws(
  () => preElbowRecipeProfiles(changedRecipes),
  /Unrecorded elbow recipe edit/,
);
const expected = {
  "elbow-bones": ["humerus", "radius", "ulna"],
  "elbow-humeroulnar": ["humerus", "ulna"],
  "elbow-radiocapitellar": ["humerus", "radius"],
  "elbow-proximal-radioulnar": ["radius", "ulna"],
  "elbow-supinator": ["humerus", "radius", "ulna", "supinator"],
};
const pins = JSON.parse(
  await readFile("content/elbow-study-pins.json", "utf8"),
);
const sourceRows = (
  await readFile("../work/bodyparts3d/isa_element_parts.txt", "utf8")
)
  .trim()
  .split(/\r?\n/)
  .map((r) => r.split("\t"));
const geometries = new Map();
for (const b of pins.bundles) {
  const bytes = await readFile("public" + b.url);
  same(hash(bytes), b.sha256);
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  for (const s of pins.entries.filter((s) => s.bundle === b.id))
    geometries.set(s.id, gltf.scene.getObjectByName(s.nodeName).geometry);
}
for (const s of pins.entries) {
  same(s.sourceTree, "isa");
  same(
    sourceRows.filter((r) => r[0] === s.fmaId).map((r) => [r[1], r[2]]),
    [[s.sourceName, s.sources.map((p) => p.file).join(",")]],
  );
}
for (const side of ["both", "left", "right"]) {
  const scope = catalog.structures.filter(
    (s) =>
      s.regions.includes("forearm") &&
      (side === "both" || s.laterality === side),
  );
  const allBounds = [];
  for (const study of elbowStudySets) {
    const visible = stageStructures(scope, profile, study.id),
      visibleIds = visible.map((s) => s.id);
    same(
      visible.map((s) => s.sourceName).sort((a, b) => a.localeCompare(b)),
      (side === "both" ? ["left", "right"] : [side])
        .flatMap((s) => expected[study.id].map((n) => s + " " + n))
        .sort((a, b) => a.localeCompare(b)),
    );
    same(stageStructures(scope, profile, "free", study.id), visible);
    const cards = studyLibrary(scope, profile);
    same(
      cards.filter((c) => c.recipes.some((r) => r.id === study.id)).length,
      1,
    );
    same(
      filterStudyLibrary(cards, "elbow").some((c) =>
        c.recipes.some((r) => r.id === study.id),
      ),
      true,
    );
    const initial = dissectionReducer(initialDissection, {
      type: "focus",
      id: study.id,
    });
    const removed = dissectionReducer(initial, {
      type: "remove",
      id: visibleIds[0],
    });
    const undo = dissectionReducer(removed, { type: "undo" }),
      redo = dissectionReducer(undo, { type: "redo" });
    same(
      resolveDissection(scope, profile, removed).visible.map((s) => s.id),
      visibleIds.slice(1),
    );
    same(
      resolveDissection(scope, profile, undo).visible.map((s) => s.id),
      visibleIds,
    );
    same(
      resolveDissection(scope, profile, redo).visible.map((s) => s.id),
      visibleIds.slice(1),
    );
    const input = {
      catalog,
      region: "forearm",
      recipeId: study.id,
      structures: scope,
      visibleIds,
      enabled: true,
    };
    const bounds = elbowStudyBounds(input);
    assert(bounds);
    allBounds.push(bounds);
    same(
      bounds.max[1] - bounds.min[1] < 1.7,
      true,
      "Source-based joint/proximal forearm close-up",
    );
    same(
      elbowStudyBounds({ ...input, visibleIds: visibleIds.slice(1) }),
      bounds,
      "Single removal keeps stable framing",
    );
    for (const s of visible) {
      const geometry = geometries.get(s.id),
        anchor = closeUpLabelAnchor(geometry, s.anchor, bounds);
      assert(anchor);
      same(
        anchor.every((v, i) => v >= bounds.min[i] && v <= bounds.max[i]),
        true,
      );
      if (!s.anchor.every((v, i) => v >= bounds.min[i] && v <= bounds.max[i])) {
        const p = geometry.getAttribute("position");
        let actual = false;
        for (let i = 0; i < p.count; i++)
          if (
            p.getX(i) === anchor[0] &&
            p.getY(i) === anchor[1] &&
            p.getZ(i) === anchor[2]
          ) {
            actual = true;
            break;
          }
        same(
          actual,
          true,
          "Label remains on a real source vertex, not a clamped approximation",
        );
      }
      if (s.system === "muscles")
        same(
          s.bounds.min.every(
            (v, i) => v >= bounds.min[i] && s.bounds.max[i] <= bounds.max[i],
          ),
          true,
          "Whole supinator included",
        );
      labelChecks++;
      const link = makeStudyLink(catalog, "forearm", s.id, side, study.id);
      const result = resolveStudyLink(
        catalog,
        "forearm",
        parseStudyLink(
          Object.fromEntries(
            new URL(link, "https://atlas.invalid").searchParams,
          ),
        ),
      );
      same(result.status, "ready");
      same(result.visibleIds, visibleIds);
      same(result.selected.id, s.id);
      links++;
    }
    for (const change of [
      { enabled: false },
      { catalog: null },
      { region: "shoulder-arm" },
      { recipeId: "bones" },
      { visibleIds: [] },
      { visibleIds: ["missing"] },
      { visibleIds: [...visibleIds, visibleIds[0]] },
      {
        visibleIds: [
          ...visibleIds,
          scope.find((s) => s.system === "vessels").id,
        ],
      },
    ]) {
      same(elbowStudyBounds({ ...input, ...change }), null);
      rejectionChecks++;
    }
    const foreign = structuredClone(scope);
    foreign.find((s) => s.id === visibleIds[0]).center[0] += 0.01;
    same(elbowStudyBounds({ ...input, structures: foreign }), null);
    rejectionChecks++;
    const detached = elbowStudyBounds(input);
    detached.min[0] = 999;
    same(elbowStudyBounds(input), bounds);
  }
  for (const b of allBounds)
    same(b, allBounds[0], "All five studies share fixed source-based framing");
}
const scope = catalog.structures.filter((s) => s.regions.includes("forearm"));
const input = {
  catalog,
  region: "forearm",
  recipeId: "elbow-bones",
  structures: scope,
  visibleIds: stageStructures(scope, profile, "elbow-bones").map((s) => s.id),
  enabled: true,
};
for (const mutate of [
  (c) => (c.sourceVersion = "other"),
  (c) => (c.coordinateSystem.unitsPerMillimetre *= 2),
  (c) => c.bundles.push(c.bundles.find((b) => b.id === pins.bundles[0].id)),
  (c) => (c.bundles.find((b) => b.id === pins.bundles[0].id).sha256 = "bad"),
  ...pins.entries.flatMap((pin) => [
    (c) =>
      c.structures.splice(
        c.structures.findIndex((s) => s.id === pin.id),
        1,
      ),
    (c) => c.structures.push(c.structures.find((s) => s.id === pin.id)),
    (c) =>
      (c.structures.find((s) => s.id === pin.id).sources[0].sha256 = "bad"),
    (c) => (c.structures.find((s) => s.id === pin.id).bounds.min[0] = NaN),
  ]),
]) {
  const changed = structuredClone(catalog);
  mutate(changed);
  same(elbowStudyBounds({ ...input, catalog: changed }), null);
  rejectionChecks++;
}
same(JSON.stringify(catalog), original, "Source unchanged");

// Exercise the actual parent memo callback under all close-up suppression modes.
const { runInNewContext } = await import("node:vm");
const source = await readFile("app/body-explorer.tsx", "utf8"),
  ast = ts.createSourceFile(
    "body.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
let callback;
function visit(n) {
  if (ts.isVariableDeclaration(n) && n.name.getText(ast) === "jointCloseUp")
    callback = n.initializer.arguments[0].getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
assert(callback);
const js = ts.transpile(`(${callback})()`, { target: ts.ScriptTarget.ES2022 });
const env = {
  catalog,
  initialRegion: "forearm",
  dissection: { focusId: "elbow-bones", stageId: "free" },
  regionStructures: scope,
  available: stageStructures(scope, profile, "elbow-bones"),
  exam: false,
  focus: false,
  isolated: false,
  ghostRemoved: false,
  showOrigins: false,
  explode: 0,
  layout: "spatial",
  inspection: { plane: "off" },
  kneeStudyBounds: () => null,
  elbowStudyBounds,
};
same(
  JSON.stringify(runInNewContext(js, env)),
  JSON.stringify(elbowStudyBounds(input)),
);
for (const change of [
  { exam: true },
  { focus: true },
  { isolated: true },
  { ghostRemoved: true },
  { showOrigins: true },
  { explode: 1 },
  { layout: "tray" },
  { layout: "radial" },
  { inspection: { plane: "axial" } },
])
  same(runInNewContext(js, { ...env, ...change }), null);
console.log(
  JSON.stringify({
    passed: true,
    studies: 5,
    sideScopes: 15,
    checks,
    links,
    labelChecks,
    rejectionChecks,
    sourceSelections: 8,
    clinicalValidation: false,
    browserTesting: false,
  }),
);
