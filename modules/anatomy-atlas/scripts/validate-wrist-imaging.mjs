import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from 'node:child_process';
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import {
  contentValidator,
  readContentJson,
} from "./content-contract-tools.mjs";
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const wristEpoch='6c9acd0c0ea1ae10f10f363495d8052242901168';
const pins = await readContentJson("content/wrist-imaging-pins.json"),
  before = await readContentJson("content/wrist-imaging.before.json"),
  after = await readContentJson("content/wrist-imaging.transition.json");
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
assert.equal(before.sourceCommit,'56e9dc9e0e16f6cfbf3087a5af01aefde50e30d1');
assert.equal(before.allLessonsAndRecipesHash,'7e5592d21db98475fb72da072a073eaa1f00b0edafdc844fe38320f4f86cffe9');
assert.equal(hash(before),'6503f2a45ef89001cf485ad5a0397606f2bcd2616593c958e347da69ed606c3c');
assert.equal(hash(after),'916ff46a96c43f2d2a67d69ce140b2c027e1cc9595276d1a4ebeaf350a7f0e7a');
assert.equal(hash(pins),'318ca7e848669adbbde6b5c3f2092dc750f346c5412db0558a8b68abe6efe878');
assert.equal(after.sourceCommit,before.sourceCommit);
assert.equal(pins.sourceCommit,before.sourceCommit);
assert.deepEqual(before.tabs,['ct','mri','xray']);
assert.deepEqual(before.entries.map(({identity,group})=>({identity,group})),pins.entries);
assert.deepEqual(after.entries.map(e=>e.id),pins.entries.map(e=>e.identity.id));
const historical = await exactSourceHistoryApi(before.sourceCommit,'display-content');
const api = await exactSourceHistoryApi(wristEpoch,'wrist-initial');
const afterWrist=api,previous=historical;
assert.deepEqual(api.contentTabs,historical.contentTabs);
const cataloguePath='public/models/bodyparts3d/full-body/catalog.json';
const gitAt=(commit,path)=>execFileSync('git',['show',commit+':'+path],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const catalog=JSON.parse(gitAt(wristEpoch,cataloguePath).toString());
assert.deepEqual(catalog,JSON.parse(gitAt(before.sourceCommit,cataloguePath).toString()));
const body=api.bodyContentRecords(catalog);
const registry=new Map(body.map(record=>[`${record.representationScope}|${record.id}`,record]));
assert.equal(registry.size,body.length);
// The immutable global baseline includes the shoulder and recipes from its own
// Git epoch, not later source geometry. Keep the per-identity/live checks below.
assert.equal(
  hash({
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(
        historical.contentTabs.map((t) => [t, historical.bodyLesson(s, t)]),
      ),
    })),
    shoulder: historical.structures,
    recipes: historical.dissectionProfiles,
  }),
  before.allLessonsAndRecipesHash,
  "Exact pre-wrist Git snapshot, including historical shoulder and recipes",
);
assert.equal(pins.sourceVersion, catalog.sourceVersion);
assert.deepEqual(pins.coordinateSystem, catalog.coordinateSystem);
assert.deepEqual(
  pins.bundles,
  catalog.bundles.filter((b) => pins.bundles.some((p) => p.id === b.id)),
);
const admitted = new Map(pins.entries.map((e) => [e.identity.id, e]));
assert.equal(admitted.size, 16);
const original=new Map();
for(const [index,entry] of before.entries.entries()){
 assert.deepEqual(catalog.structures.find(s=>s.id===entry.identity.id),entry.identity);
 assert.deepEqual(Object.keys(entry.sections),before.tabs);
 assert.deepEqual(Object.keys(after.entries[index].sections),before.tabs);
 for(const tab of before.tabs){
  assert.equal(entry.sections[tab].readiness,'pending');
  original.set(`${entry.identity.id}|${tab}`,{identity:entry.identity,lesson:entry.sections[tab],golden:after.entries[index].sections[tab]});
 }
}
assert.equal(original.size,48);
function initialWristBefore(s,tab,lesson=api.bodyLesson(s,tab)){
 const entry=original.get(`${s.id}|${tab}`);
 if(!entry)return lesson;
 assert.deepEqual(s,entry.identity,'Historical wrist identity changed');
 assert.equal(hash(lesson),entry.golden,'Unrecorded wrist teaching change');
 return structuredClone(entry.lesson);
}
assert.equal(hash({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab=>[tab,initialWristBefore(s,tab)]))})),shoulder:historical.structures,recipes:historical.dissectionProfiles}),before.allLessonsAndRecipesHash,'Exact reversal of initial wrist epoch');
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
      assert.deepEqual(afterWrist.bodyLesson(s, tab), previous.bodyLesson(s, tab));
      unchangedSections++;
      continue;
    }
    sections++;
    topics.add(admitted.get(s.id).group + "/" + tab);
    assert.equal(previous.bodyLesson(s, tab).readiness, "pending");
    assert.deepEqual(initialWristBefore(s,tab),previous.bodyLesson(s,tab));
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
      catalog.structures.filter((s) => afterWrist.bodyLesson(s, t).readiness === 'draft').length,
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
  () => initialWristBefore(pins.entries[0].identity,'ct',{
    ...api.bodyLesson(pins.entries[0].identity,'ct'),body:'unrecorded',
  }),
  /Unrecorded wrist teaching change/,
);
// Render the real existing notes callback, not a replacement view or browser session.
const require = createRequire(import.meta.url),
  React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
const noteComponent=await componentBuild({stdin:{contents:"export {SourceDisplayNotes} from './app/source-display-notes';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const noteScope={exports:{}};
runInNewContext(noteComponent.outputFiles[0].text,{module:noteScope,exports:noteScope.exports,require,console});
const {SourceDisplayNotes}=noteScope.exports;
const source = gitAt(wristEpoch,"app/body-explorer.tsx").toString(),
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
        SourceDisplayNotes,
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
