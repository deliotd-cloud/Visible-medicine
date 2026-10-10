import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import pins from '../content/hand-arterial-ultrasound-pins.json' with { type: 'json' };
import { build } from './workspace-component-test-build.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { handUsBaseline, handUsSelections, handUsHash as hash } from './pin-hand-arterial-ultrasound.mjs';
import { contentValidator } from './content-contract-tools.mjs';

const same = (a, b, m) => assert.deepEqual(structuredClone(a), structuredClone(b), m);
const root = process.cwd(), require = createRequire(root + '/package.json');
const result = await build({ stdin: { contents: `
 export {bodyLesson,bodyContent} from './app/body-content';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {structures} from './app/anatomy-data';
 export {dissectionProfiles} from './app/dissection-data';
 export {regionalTours} from './lib/regional-tours';
 export {contentTabs} from './lib/content-types';
 export {bodyContentRecords} from './lib/content-export';
 export {bodyReviewMaterial} from './lib/body-review-material';
 export {parseBodyReviewResponse} from './lib/body-review-response';
 export {bodyReviewContext} from './lib/body-review-context';
 export {blankBodyReview} from './lib/body-review-decisions';
 export {postBodyDecision} from './lib/body-review-api';
 export {SourceDisplayNotes} from './app/source-display-notes';
 export {handArterialUltrasoundLesson} from './lib/hand-arterial-ultrasound';
 export {handArterialUltrasoundTopics} from './content/hand-arterial-ultrasound';`, resolveDir: root, loader: 'tsx' },
 bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic' });
const module = { exports: {} };
runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require,
 crypto, TextEncoder, TextDecoder, structuredClone, URL, URLSearchParams, Request, Response, Headers });
const api = module.exports, parent = await exactSourceHistoryApi(handUsBaseline, 'display-review');
assert.equal(pins.parentCommit, handUsBaseline);
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = api.bodyDisplayCatalog(raw);
same(catalog, parent.bodyDisplayCatalog(raw));
assert.equal(hash(catalog), pins.previousCatalogHash);
assert.equal(hash(api.regionalTours), pins.previousToursHash);
assert.equal(hash(api.dissectionProfiles), pins.previousDissectionHash);
same(api.structures, parent.structures);
same(pins.entries.map(e => e.identity.fmaId), Object.values(handUsSelections).flat());
for (const [group, fmas] of Object.entries(handUsSelections))
 same(pins.entries.filter(e => e.group === group).map(e => e.identity.fmaId), fmas);
assert.equal(pins.entries.length, 28);
assert.equal(new Set(pins.entries.map(e => e.identity.id)).size, 28);
for (const b of pins.bundles) {
 same(catalog.bundles.find(x => x.id === b.id), b);
 const bytes = await readFile('public' + b.url.split('?')[0]);
 assert.equal(bytes.length, b.bytes);
 const { createHash } = await import('node:crypto');
 assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
}
for (const path of ['public/models/bodyparts3d/full-body/catalog.json', 'LICENSES/THIRD_PARTY_NOTICES.md',
 'package-lock.json', 'app/body-explorer.tsx', 'lib/anatomy-coordinates.ts',
 'lib/regional-tours.ts', 'lib/atlas-practice.ts', 'lib/reasoning-questions.ts']) {
 const old = execFileSync('git', ['show', handUsBaseline + ':' + path], { encoding: 'utf8', maxBuffer: 32e6 });
 assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), old.replaceAll('\r\n', '\n'), path);
}
const previousTopics = catalog.structures.map(s => ({ id: s.id,
 topics: api.contentTabs.map(tab => ({ tab, ...parent.bodyLesson(s, tab) })) }));
assert.equal(hash(previousTopics), pins.previousAllTopicsHash);
let historyRefusals = 0;
if (!process.argv.includes('--record')) {
const {beforeHandArterialUltrasound}=await import('./hand-arterial-ultrasound-history.mjs');
const replay = beforeHandArterialUltrasound(api);
assert.equal(beforeHandArterialUltrasound(replay), replay);
assert.equal(hash(catalog.structures.map(s => ({ id: s.id,
 topics: api.contentTabs.map(tab => ({ tab, ...replay.bodyLesson(s, tab) })) }))), pins.previousAllTopicsHash);
for (const {identity, previous} of pins.entries) {
 assert.throws(() => replay.bodyLesson({...identity, name: 'Foreign'}, 'ultrasound')); historyRefusals++;
 for (const value of [{...api.bodyLesson(identity, 'ultrasound'), body: 'Foreign'}, previous.ultrasound]) {
  assert.throws(() => beforeHandArterialUltrasound({...api, bodyLesson(s, t) {
   return s.id === identity.id && t === 'ultrasound' ? value : api.bodyLesson(s, t);
  }})); historyRefusals++;
 }
}
assert.equal(historyRefusals, 84);
if (process.argv.includes('--history-only')) {
 const evidence = {baseline: handUsBaseline, reconstructedTopics: 9936,
  historyRefusals, currentTransitionHash: hash(JSON.parse(await readFile('content/hand-arterial-ultrasound-transition.json'))),
  clinicalApproval: false, browserAcceptance: false};
 await writeFile('docs/hand-arterial-ultrasound-history-validation.json', JSON.stringify(evidence, null, 2) + '\n');
 console.log(JSON.stringify(evidence));
 process.exit(0);
}
}
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
const records = api.bodyContentRecords(catalog), previousRecords = parent.bodyContentRecords(catalog);
const registry = new Map(previousRecords.map(r => [r.representationScope + '|' + r.id, r]));
const validate = await contentValidator(registry);
const React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const viewer = await readFile('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('viewer.tsx', viewer, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
 if (ts.isArrowFunction(node) && ts.isBlock(node.body) && node.body.getText(ast).includes('const content = bodyContent(selected, value);')) {
  assert.equal(callback, undefined); callback = node.getText(ast);
 }
 ts.forEachChild(node, visit);
}
visit(ast); assert(callback);
const callbackJs = ts.transpile('const renderNote=' + callback, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React });
let changed = 0, unchanged = 0, worksheets = 0, rendered = 0, mutations = 0, stale = 0, imagingRefusals = 0;
const transitions = [];
const leaves = (v, path = []) => v === null || typeof v !== 'object' ? [path]
 : Object.entries(v).flatMap(([key, child]) => leaves(child, [...path, key]));
// Exercise the changed paths first so integration failures surface promptly.
for (const s of [...catalog.structures].sort((a, b) => Number(targets.has(b.id)) - Number(targets.has(a.id)))) {
 const entry = targets.get(s.id);
 for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), after = api.bodyLesson(s, tab);
  if (!entry || tab !== 'ultrasound') {
   same(after, before, s.id + '|' + tab);
   assert.equal(api.handArterialUltrasoundLesson(s, tab), undefined); unchanged++; continue;
  }
  same(s, entry.identity); same(entry.topics, ['ultrasound']); same(before, entry.previous.ultrasound);
  assert.equal(before.readiness, 'pending'); assert.equal(after.readiness, 'draft');
  same(after, api.handArterialUltrasoundLesson(s, tab));
  const { readiness: _r, ...shown } = after;
  same(api.bodyContent(s, tab), shown);
  assert(after.title.startsWith(s.name + ' ·'));
  assert.match(after.note, /revision-bound radiologist review/);
  assert.match(after.note, /No patient images, registration or clinical approval/);
  assert.match(after.note, /access remain independent/);
  assert(after.bullets.some(b => /separation to zero/i.test(b)) || /separation to zero/i.test(after.note));
  assert.equal(after.body, api.handArterialUltrasoundTopics[entry.group].body);
  assert.equal(new Set(after.citations).size, after.citations.length);
  assert(after.citations.length && after.citations.every(u => new URL(u).protocol === 'https:'));
  const record = records.find(r => r.id === s.id);
  assert(validate(record)); same(record.content.ultrasound, after);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const jsx = runInNewContext(callbackJs + ';renderNote("ultrasound")', {
   React, bodyContent: api.bodyContent, selected: s, SourceDisplayNotes: api.SourceDisplayNotes,
   WorkspaceModeButton: ({ children }) => React.createElement('button', null, children),
   ComponentImagingNotes: () => null, ScanLine: () => null, catalog, side: 'both', exam: false,
   openNested() { throw Error('No automatic specimen navigation'); },
  });
  const html = render(jsx);
  assert(html.includes(render(React.createElement('p', null, after.body))));
  for (const bullet of after.bullets) assert(html.includes(render(React.createElement('li', null, bullet))));
  for (const url of after.citations) assert(html.includes(url.replaceAll('&', '&amp;')));
  assert(html.includes('No imaging study loaded')); rendered++;
  const detached = structuredClone(after);
  after.bullets.push('foreign'); after.citations.length = 0;
  same(api.bodyLesson(s, tab), detached);
  transitions.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(detached) }); changed++;
 }
 const previous = await parent.bodyReviewMaterial(s.id), packet = await api.bodyReviewMaterial(s.id);
 same(packet.source, previous.source); same(packet.reasoning, previous.reasoning); same(packet.guidedTours, previous.guidedTours);
 assert.equal(packet.fingerprints.source, previous.fingerprints.source);
 assert.equal(packet.approval, false); assert.equal(packet.status, 'worksheet-not-submitted');
 if (!entry) { same(packet, previous, 'Unrelated worksheet changed: ' + s.id); continue; }
 worksheets++;
 assert.notEqual(packet.fingerprints.teaching, previous.fingerprints.teaching);
 assert.equal(packet.fingerprints.checklist, previous.fingerprints.checklist);
 assert(await api.parseBodyReviewResponse(packet, s.id));
 const alteredPacket = structuredClone(packet); alteredPacket.topics.find(t => t.tab === 'ultrasound').body = 'Foreign wording';
 assert.equal(await api.parseBodyReviewResponse(alteredPacket, s.id), null);
 const context = await api.bodyReviewContext(s.id);
 assert.equal(context.revisions.imaging, null);
 assert(context.blockers.imaging.length > 0);
 const storage = new Proxy({}, { get() { throw Error('Invalid request reached private storage'); } });
 for (const delta of [{ materialHash: previous.materialHash }, { revisionHash: '0'.repeat(64) }]) {
  const response = await api.postBodyDecision(new Request('https://review.test/api/body-decisions', {
   method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_HAND_US_REVIEW' },
   body: JSON.stringify({ catalogScope: context.catalogScope, structureId: s.id, track: 'teaching', expectedVersion: 0,
    materialHash: context.materialHash, revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
    draft: api.blankBodyReview(context, 'teaching'), ...delta }),
  }), storage);
  assert.equal(response.status, 409); stale++;
 }
 const draft = api.blankBodyReview(context, 'imaging');
 draft.status = 'approved'; draft.reviewer = 'SYNTHETIC_REVIEWER';
 draft.qualification = 'Synthetic test only'; draft.scope = 'Synthetic image approval refusal';
 draft.attested = true;
 for (const key of Object.keys(draft.checks)) draft.checks[key] = true;
 const imagingResponse = await api.postBodyDecision(new Request('https://review.test/api/body-decisions', {
  method: 'POST', headers: { origin: 'https://review.test', 'content-type': 'application/json', 'oai-authenticated-user-id': 'SYNTHETIC_HAND_US_REVIEW' },
  body: JSON.stringify({ catalogScope: context.catalogScope, structureId: s.id, track: 'imaging', expectedVersion: 0,
   materialHash: context.materialHash, revisionHash: context.revisions.imaging, checklistVersion: context.checklistVersion, draft }),
 }), storage);
 assert.equal(imagingResponse.status, 422);
 assert.match((await imagingResponse.json()).error, /No validated acquired-image/); imagingRefusals++;
 for (const path of leaves(s)) {
  for (const remove of [false, true]) {
   const bad = structuredClone(s); let obj = bad;
   for (const key of path.slice(0, -1)) obj = obj[key];
   const key = path.at(-1), old = obj[key];
   if (remove) delete obj[key];
   else obj[key] = typeof old === 'number' ? old + .1 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
   assert.equal(api.handArterialUltrasoundLesson(bad, 'ultrasound'), undefined); mutations++;
  }
 }
 for (const bad of [{ ...s, foreign: true }, { ...s, sources: [] }, { ...s, sources: [...s.sources, ...s.sources] }]) {
  assert.equal(api.handArterialUltrasoundLesson(bad, 'ultrasound'), undefined); mutations++;
 }
 if (s.sources.length > 1) {
  const bad = structuredClone(s); bad.sources.reverse();
  assert.equal(api.handArterialUltrasoundLesson(bad, 'ultrasound'), undefined); mutations++;
 }
}
assert.equal(changed, 28); assert.equal(unchanged, 9908);
assert.equal(worksheets, 28); assert.equal(rendered, 28); assert.equal(stale, 56); assert.equal(imagingRefusals, 28);
const wordCounts = Object.fromEntries(Object.entries(api.handArterialUltrasoundTopics).map(([group, t]) =>
 [group, [t.body, ...t.bullets].join(' ').trim().split(/\s+/).length]));
same(Object.keys(wordCounts).sort(), Object.keys(handUsSelections).sort());
assert(Object.values(wordCounts).reduce((n, v) => n + v, 0) <= 420);
const transition = { parentCommit: handUsBaseline, pinsHash: hash(pins),
 previousAllTopicsHash: pins.previousAllTopicsHash, entries: transitions };
const path = 'content/hand-arterial-ultrasound-transition.json';
if (process.argv.includes('--record')) await writeFile(path, JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else same(JSON.parse(await readFile(path)), transition);
const report = { baseline: handUsBaseline, pinsHash: hash(pins), transitionHash: hash(transition),
 newDraftPlacements: changed, preservedTopicPlacements: unchanged, changedTeachingWorksheets: worksheets,
 unchangedTeachingWorksheets: 1076, actualViewerCallbackRenderings: rendered,
 sourceMutationRefusals: mutations, stalePostRefusalsBeforeStorage: stale, imagingApprovalRefusalsBeforeStorage: imagingRefusals, historyRefusals, wordCounts,
 geometryAndModelsUnchanged: true, toursAndDissectionUnchanged: true, assetsAndLicencesUnchanged: true,
 clinicalApproval: false, browserAcceptance: false };
await writeFile('docs/hand-arterial-ultrasound-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
