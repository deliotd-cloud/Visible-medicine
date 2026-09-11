import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import {
  contentContext,
  contentValidator,
  readContentJson,
} from "./content-contract-tools.mjs";
import { authoringBeforeWristImaging } from "./wrist-imaging-history.mjs";
const context = await contentContext(),
  { api, catalog, body, registry } = context;
const previous = authoringBeforeWristImaging(context),
  pins = await readContentJson("content/wrist-imaging-pins.json"),
  before = await readContentJson("content/wrist-imaging.before.json");
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
assert.equal(
  hash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((t) => [t, previous.bodyLesson(s, t)]),
      ),
    })),
    shoulder: api.structures,
    recipes: api.dissectionProfiles,
  }),
  before.allLessonsAndRecipesHash,
  "Every earlier lesson and study recipe preserved",
);
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
assert.deepEqual(
  pins.bundles,
  catalog.bundles.filter((b) => pins.bundles.some((p) => p.id === b.id)),
);
const admitted = new Map(pins.entries.map((e) => [e.identity.id, e]));
assert.equal(admitted.size, 16);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === "right").length,
  8,
);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === "left").length,
  8,
);
let sections = 0,
  unchangedSections = 0,
  rejectedBindings = 0,
  renders = 0;
const topics = new Set(),
  validate = await contentValidator(registry);
for (const s of catalog.structures) {
  const record = body.find((r) => r.id === s.id);
  assert(validate(record));
  for (const tab of api.contentTabs) {
    const lesson = api.wristImagingLesson(s, tab);
    if (!admitted.has(s.id) || !before.tabs.includes(tab)) {
      assert.equal(lesson, undefined);
      assert.deepEqual(api.bodyLesson(s, tab), previous.bodyLesson(s, tab));
      unchangedSections++;
      continue;
    }
    sections++;
    topics.add(admitted.get(s.id).group + "/" + tab);
    assert.equal(previous.bodyLesson(s, tab).readiness, "pending");
    assert.deepEqual(api.bodyLesson(s, tab), lesson);
    assert.deepEqual(record.content[tab], lesson);
    assert.equal(lesson.readiness, "draft");
    assert(lesson.title.startsWith(s.name + " · "));
    assert(
      lesson.note.includes("review pending") &&
        lesson.note.includes("No patient images") &&
        lesson.note.includes("paid-lecture access"),
    );
    assert.equal(lesson.bullets.length, 4);
    assert(lesson.citations.length > 0);
    for (const url of lesson.citations)
      assert.equal(new URL(url).protocol, "https:");
    const expected = structuredClone(lesson);
    lesson.bullets.push("consumer mutation");
    lesson.citations.length = 0;
    assert.deepEqual(api.wristImagingLesson(s, tab), expected);
    assert.equal(record.validation.clinicalApproval, "not-included");
    assert.deepEqual(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
  }
}
assert.equal(sections, 48);
assert.equal(topics.size, 15);
assert.equal(unchangedSections, 9150);
assert.deepEqual(
  Object.fromEntries(
    ["ct", "mri", "xray", "ultrasound"].map((t) => [
      t,
      body.filter((r) => r.content[t].readiness === "draft").length,
    ]),
  ),
  { ct: 106, mri: 108, xray: 69, ultrasound: 41 },
);
const rows = (
  await readFile("../work/bodyparts3d/isa_element_parts.txt", "utf8")
)
  .trim()
  .split(/\r?\n/)
  .map((l) => l.split("\t"));
for (const { identity: s } of pins.entries) {
  assert.equal(s.sourceTree, "isa");
  assert.deepEqual(
    rows.filter((r) => r[0] === s.fmaId).map((r) => [r[1], r[2]]),
    [[s.sourceName, s.sources.map((p) => p.file).join(",")]],
  );
  for (const change of [
    (s) => {
      s.id += "-foreign";
    },
    (s) => {
      s.fmaId = "FMA0";
    },
    (s) => {
      s.name += " changed";
    },
    (s) => {
      s.sourceName += " changed";
    },
    (s) => {
      s.laterality = s.laterality === "left" ? "right" : "left";
    },
    (s) => {
      s.sourceTree = "partof";
    },
    (s) => {
      s.system = "nerves";
    },
    (s) => {
      s.category = "nerve";
    },
    (s) => {
      s.region = "leg";
    },
    (s) => {
      s.regions.push("leg");
    },
    (s) => {
      s.bundle += "-foreign";
    },
    (s) => {
      s.nodeName = "FMA0";
    },
    (s) => {
      s.bounds.min[0] += 0.1;
    },
    (s) => {
      s.center[0] += 0.1;
    },
    (s) => {
      s.anchor[0] += 0.1;
    },
    (s) => {
      s.sources[0].file += "-foreign";
    },
    (s) => {
      s.sources[0].sha256 = "0".repeat(64);
    },
    (s) => {
      s.provenance.sourceVersion = "3.0";
    },
    (s) => {
      s.provenance.license = "unknown";
    },
    (s) => {
      s.validation.anatomicalReview = true;
    },
  ]) {
    const changed = structuredClone(s);
    change(changed);
    for (const tab of before.tabs) {
      assert.equal(api.wristImagingLesson(changed, tab), undefined);
      rejectedBindings++;
    }
  }
}
// Source-specific distinctions, not grouped-name guesses.
const find = (fma) => catalog.structures.find((s) => s.fmaId === fma);
assert(
  api
    .bodyLesson(find("FMA24441"), "mri")
    .bullets[0].includes("palmar to the triquetrum"),
);
assert(
  api.bodyLesson(find("FMA24439"), "ct").bullets[0].includes("triquetrum"),
);
assert(
  api
    .bodyLesson(find("FMA23725"), "xray")
    .bullets[0].includes("index-metacarpal"),
);
assert(api.bodyLesson(find("FMA24448"), "ct").bullets[0].includes("hook"));
assert.throws(
  () =>
    authoringBeforeWristImaging({
      catalog,
      api: {
        ...api,
        bodyLesson(s, t) {
          const value = api.bodyLesson(s, t);
          return s.id === pins.entries[0].identity.id && t === "ct"
            ? { ...value, body: "unrecorded" }
            : value;
        },
      },
    }),
  /Unrecorded wrist teaching change/,
);
// Render the real existing notes callback, not a replacement view or browser session.
const require = createRequire(import.meta.url),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
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
  if (
    ts.isJsxElement(n) &&
    n.openingElement.tagName.getText(ast) === "GroupedAnatomyNotes"
  )
    callback = n.children
      .find((c) => ts.isJsxExpression(c))
      ?.expression?.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
assert(callback);
const js = ts.transpile(`(${callback})(topic)`, {
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
});
for (const { identity: selected } of pins.entries)
  for (const topic of before.tabs) {
    const html = renderToStaticMarkup(
      runInNewContext(js, {
        React,
        selected,
        topic,
        bodyContent: api.bodyContent,
        catalog,
        side: "both",
        exam: false,
        ScanLine: () => null,
        WorkspaceModeButton: ({ children }) =>
          React.createElement("button", null, children),
        ComponentImagingNotes: (props) => {
          assert.equal(props.parentId, selected.id);
          assert.equal(props.topic, topic);
          return null;
        },
        openNested: () => {
          throw Error("Reading notes must not open another specimen");
        },
      }),
    );
    assert(html.includes("No imaging study loaded"));
    assert(html.includes("review pending"));
    assert(html.includes(selected.name));
    assert(html.includes("Reference 1"));
    renders++;
  }
console.log(
  JSON.stringify({
    selections: 16,
    sections,
    conceptTopics: topics.size,
    unchangedSections,
    rejectedBindings,
    sourceRowsVerified: 16,
    actualNoteRenders: renders,
    clinicalApproval: "not-included",
  }),
);
