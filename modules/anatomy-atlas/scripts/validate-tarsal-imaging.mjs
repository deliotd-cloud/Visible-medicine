import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import {
  contentContext,
  readContentJson,
  contentValidator,
} from "./content-contract-tools.mjs";
import {
  authoringBeforeTarsalImaging,
  tarsalContentHash as hash,
} from "./tarsal-imaging-history.mjs";
import {
  tarsalImagingTopics,
  tarsalImagingReferences,
  tarsalImagingSelectionNotes,
} from "../content/tarsal-imaging-concepts.ts";

const context = await contentContext(),
  { api, catalog, body, registry } = context;
const before = authoringBeforeTarsalImaging(context),
  pins = await readContentJson("content/tarsal-imaging-pins.json");
assert.equal(
  hash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((t) => [t, before.bodyLesson(s, t)]),
      ),
    })),
    shoulder: api.structures,
    recipes: api.dissectionProfiles,
  }),
  pins.previousAllLessonsAndRecipesHash,
  "All earlier root lessons, shoulder content and study recipes retained",
);
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
assert.deepEqual(
  pins.bundles,
  catalog.bundles.filter((b) => pins.bundles.some((p) => p.id === b.id)),
);
assert.equal(pins.entries.length, 14);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === "right").length,
  7,
);
assert.equal(
  pins.entries.filter((e) => e.identity.laterality === "left").length,
  7,
);
const selectedIds = new Set(pins.entries.map((e) => e.identity.id)),
  validate = await contentValidator(registry);
let sections = 0,
  unchanged = 0,
  rejected = 0;
for (const s of catalog.structures) {
  const record = body.find((r) => r.id === s.id);
  assert(validate(record));
  for (const t of api.contentTabs) {
    const lesson = api.tarsalImagingLesson(s, t);
    if (!selectedIds.has(s.id) || !pins.tabs.includes(t)) {
      assert.equal(lesson, undefined);
      assert.deepEqual(api.bodyLesson(s, t), before.bodyLesson(s, t));
      unchanged++;
      continue;
    }
    sections++;
    assert.equal(before.bodyLesson(s, t).readiness, "pending");
    assert.deepEqual(api.bodyLesson(s, t), lesson);
    assert.deepEqual(record.content[t], lesson);
    assert.equal(lesson.readiness, "draft");
    assert(lesson.title.startsWith(s.name + " · "));
    assert.match(lesson.note, /review pending/);
    assert.match(lesson.note, /No patient images/);
    assert.match(lesson.note, /paid-lecture access/);
    assert.equal(lesson.bullets.length, 4);
    assert.equal(record.validation.clinicalApproval, "not-included");
    assert.deepEqual(record.validation.materialRevisions, {
      geometry: null,
      teaching: null,
      imaging: null,
    });
    const copy = structuredClone(lesson);
    lesson.bullets.length = 0;
    lesson.citations.push("changed");
    assert.deepEqual(api.tarsalImagingLesson(s, t), copy);
  }
}
assert.equal(sections, 42);
assert.equal(unchanged, 9156);
const rows = (
  await readFile("../work/bodyparts3d/isa_element_parts.txt", "utf8")
)
  .trim()
  .split(/\r?\n/)
  .map((l) => l.split("\t"));
for (const { identity: s } of pins.entries) {
  assert.equal(s.system, "skeleton");
  assert.equal(s.region, "foot");
  assert.deepEqual(
    rows.filter((r) => r[0] === s.fmaId).map((r) => [r[1], r[2]]),
    [[s.sourceName, s.sources.map((p) => p.file).join(",")]],
  );
  for (const change of [
    (s) => (s.id += "-foreign"),
    (s) => (s.fmaId = "FMA55117"),
    (s) => (s.name += " changed"),
    (s) => (s.laterality = "midline"),
    (s) => (s.region = "head-neck"),
    (s) => (s.sources[0].sha256 = "changed"),
    (s) => (s.nodeName = "foreign"),
    (s) => (s.bundle = "foreign"),
    (s) => (s.anchor[0] += 0.1),
    (s) => (s.validation.anatomicalReview = true),
  ]) {
    const changed = structuredClone(s);
    change(changed);
    for (const tab of pins.tabs) {
      assert.equal(api.tarsalImagingLesson(changed, tab), undefined);
      rejected++;
    }
  }
}
for (const fma of ["FMA55117", "FMA55118"])
  for (const tab of pins.tabs)
    assert.equal(
      api.tarsalImagingLesson(
        catalog.structures.find((s) => s.fmaId === fma),
        tab,
      ),
      undefined,
    );
assert.throws(
  () =>
    authoringBeforeTarsalImaging({
      catalog,
      api: {
        ...api,
        bodyLesson(s, t) {
          const v = api.bodyLesson(s, t);
          return selectedIds.has(s.id) && t === "ct"
            ? { ...v, body: "unrecorded" }
            : v;
        },
      },
    }),
  /Unrecorded tarsal teaching change/,
);

// Conservative whole-topic word budgets, even for editorial model-limit bullets.
const words = (s) => s.match(/\S+/g)?.length || 0;
const budgets = {
  anatomy: words(tarsalImagingSelectionNotes.map((n) => n.note).join(" ")),
};
assert.equal(
  new Set(Object.values(tarsalImagingReferences)).size,
  Object.keys(tarsalImagingReferences).length,
);
for (const g of Object.values(tarsalImagingTopics))
  for (const v of Object.values(g))
    for (const ref of v.references)
      budgets[ref] =
        (budgets[ref] || 0) + words([v.body, ...v.bullets].join(" "));
for (const [ref, count] of Object.entries(budgets)) {
  assert(count <= 200, ref + ": " + count);
  assert.equal(new URL(tarsalImagingReferences[ref]).protocol, "https:");
}

// Render the existing notes callback, not a replacement component or browser.
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
const js = ts.transpile("(" + callback + ")(topic)", {
  jsx: ts.JsxEmit.React,
  target: ts.ScriptTarget.ES2022,
});
let renders = 0;
for (const { identity: selected } of pins.entries)
  for (const topic of pins.tabs) {
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
          throw Error("Reading must not open a specimen");
        },
      }),
    );
    assert(html.includes(selected.name));
    assert(html.includes("No imaging study loaded"));
    assert(html.includes("review pending"));
    assert(html.includes("Reference 1"));
    for (const href of api.tarsalImagingLesson(selected, topic).citations)
      assert(html.includes(href));
    renders++;
  }
console.log(
  JSON.stringify({
    selections: 14,
    sections,
    unchangedSections: unchanged,
    rejectedBindings: rejected,
    sourceRows: 14,
    actualNoteRenders: renders,
    sourceWordCounts: budgets,
    clinicalApproval: false,
    browserTesting: false,
  }),
);
