#!/usr/bin/env node
// Read-only, source-bound check for one isolated website import candidate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';

const parentRoot = 'F:/VisibleMedicine/staging/20261027-guided-focus-final-website';
const nativeRoot = 'F:/VisibleMedicine/staging/20261027-coccygeus-tour-native';
const parentReceiptHash = 'dd2cfb3c72b04bf254b582dfcbd2a00d499be80bc660d6d0eb8d29ef02981048';
const nativeReceiptHash = 'e3d72e9052a335242a8ef2de79de0fd804cafd2a16adc4d20d44b6bd48f74937';
const deltaHash = '27f565f1d76c98d523777b11ca0d0b53ac7055a626864482055fae93f10f0295';
const expectedHead = 'a9f5930a853bfb7b419ffd756bb29cefc174f3da';
const expectedTour = 'coccygeus-pelvic-landmarks';
const reviewRoot = 'atlas-review';

if (process.argv.length !== 3) {
  console.error('Usage: node check-coccygeus-import.mjs <candidate-website-directory>');
  process.exit(2);
}
const candidate = resolve(process.argv[2]);
const parent = join(parentRoot, 'website');
const native = join(nativeRoot, 'atlas');
const bytes = (root, relative) => readFileSync(join(root, relative));
const string = (root, relative) => bytes(root, relative).toString('utf8');
const json = (root, relative) => JSON.parse(string(root, relative));
const sha = value => createHash('sha256').update(value).digest('hex');
const same = (leftRoot, rightRoot, relative) =>
  assert.deepEqual(bytes(leftRoot, relative), bytes(rightRoot, relative), relative);
const fail = message => { throw Error(message); };

const parentReceipt = bytes(parentRoot, 'SOURCE_CANDIDATE.json');
const nativeReceipt = bytes(nativeRoot, 'SOURCE_CANDIDATE.json');
const deltaBytes = bytes(nativeRoot, 'REVIEW_DELTA.json');
assert.equal(sha(parentReceipt), parentReceiptHash, 'website parent receipt');
assert.equal(sha(nativeReceipt), nativeReceiptHash, 'native receipt');
assert.equal(sha(deltaBytes), deltaHash, 'native review delta');
const parentSource = JSON.parse(parentReceipt);
const nativeSource = JSON.parse(nativeReceipt);
assert.equal(parentSource.sourcePaths, 6941);
assert.equal(nativeSource.head, expectedHead);
assert.equal(nativeSource.websiteParent.sha256, parentReceiptHash);
assert.equal(resolve(nativeSource.atlas), resolve(native));
assert.equal(statSync(candidate).isDirectory(), true);
assert.notEqual(candidate.toLowerCase(), parent.toLowerCase(), 'candidate must be separate from parent');
assert.notEqual(candidate.toLowerCase(), native.toLowerCase(), 'candidate must be separate from native');

// Bind every sampled parent and native source file to its immutable receipt.
const parentRows = new Map(parentSource.sourceRows.map(row => [row.path, row]));
const nativeRows = new Map(nativeSource.sourceRows.map(row => [row.path, row]));
function receiptFile(root, rows, relative) {
  const row = rows.get(relative) ?? fail(`missing receipt row: ${relative}`);
  const body = bytes(root, relative);
  assert.equal(sha(body), row.sha256, `receipt hash: ${relative}`);
  if (row.bytes !== undefined) assert.equal(body.length, row.bytes, `receipt length: ${relative}`);
}
const imported = path => `${reviewRoot}/${path}`;
const registry = imported('lib/regional-tours.ts');
const newTour = imported('lib/coccygeus-tour.ts');
const newPins = imported('content/coccygeus-tour-pins.json');
const displayPins = imported('content/body-review-display-pins.json');
for (const path of [registry, displayPins, imported('lib/body-review-decisions.ts')])
  receiptFile(parent, parentRows, path);
for (const path of ['lib/regional-tours.ts', 'lib/coccygeus-tour.ts',
  'content/coccygeus-tour-pins.json', 'content/body-review-display-pins.json'])
  receiptFile(native, nativeRows, path);

// Existing tours and their order are unchanged. The new registry and source guard
// are exactly the reviewed native files, not a new website interpretation.
// The website's imported module lives below atlas-review, unlike the native file.
assert.deepEqual(bytes(native, 'lib/regional-tours.ts'), bytes(candidate, registry));
assert.deepEqual(bytes(native, 'lib/coccygeus-tour.ts'), bytes(candidate, newTour));
assert.deepEqual(bytes(native, 'content/coccygeus-tour-pins.json'), bytes(candidate, newPins));
const oldRegistry = string(parent, registry);
const currentRegistry = string(candidate, registry);
const list = text => text.match(/export const regionalTours=\[([^;]+)\];/s)?.[1] ?? fail('tour registry missing');
const oldList = list(oldRegistry);
const newList = list(currentRegistry);
assert.equal(newList, `${oldList},coccygeusTour`);
assert.equal(oldList.includes('coccygeusTour'), false);
assert.match(currentRegistry, /coccygeusTourMatches\(catalog,tour\)/);
assert.match(currentRegistry, /throw Error\('The coccygeus guided tour does not match the available anatomy source\.'\)/);
// Every previously imported tour module remains byte-for-byte the same.
const oldModules = [...oldRegistry.matchAll(/from '\.\/([^']+)'/g)]
  .map(match => `lib/${match[1]}.ts`).filter(path => /tour/i.test(path));
for (const path of new Set(oldModules)) {
  const relative = imported(path);
  receiptFile(parent, parentRows, relative);
  same(parent, candidate, relative);
}
const tourText = string(candidate, newTour);
assert.match(tourText, /id:'coccygeus-pelvic-landmarks'/);
assert.match(tourText, /status:'draft'/);
assert.match(tourText, /revision:pins\.tourRevision/);
assert.equal((tourText.match(/stop\('/g) ?? []).length, 4);
assert.match(tourText, /radiologist review remains pending/);

// All 1,104 original structure identities and 9,936 lesson placements survive
// without rewriting any teaching snapshot or borrowing a review decision.
const teachingDir = imported('content/regional-teaching');
const regions = readdirSync(join(parent, teachingDir)).filter(name => name.endsWith('.json')).sort();
assert.deepEqual(readdirSync(join(candidate, teachingDir)).filter(name => name.endsWith('.json')).sort(), regions);
let identities = 0, lessons = 0;
for (const region of regions) {
  const relative = `${teachingDir}/${region}`;
  receiptFile(parent, parentRows, relative);
  same(parent, candidate, relative);
  for (const entry of json(candidate, relative).entries) {
    identities++;
    lessons += Object.keys(entry.lessons ?? {}).length;
  }
}
assert.equal(identities, 1104);
assert.equal(lessons, 9936);
same(parent, candidate, imported('lib/body-review-decisions.ts'));

// Exactly the five tour-linked display hashes advance, and each agrees with
// the native pinned review source. No status or decision field is in this file.
const previous = json(parent, displayPins);
const actual = json(candidate, displayPins);
const nativeDisplay = json(native, 'content/body-review-display-pins.json');
assert.deepEqual(actual, nativeDisplay, 'website display pins match native import');
assert.deepEqual(Object.keys(actual), Object.keys(previous));
for (const key of ['schema', 'scope', 'algorithm', 'evidenceFields'])
  assert.deepEqual(actual[key], previous[key], `display header: ${key}`);
const byId = pins => new Map(pins.map(pin => [pin.structureId, pin.sha256]));
const before = byId(previous.pins), after = byId(actual.pins);
assert.equal(before.size, 1104);
assert.equal(after.size, 1104);
assert.deepEqual([...after.keys()], [...before.keys()], 'display pin membership/order');
const changed = [...before].filter(([id, hash]) => after.get(id) !== hash).map(([id]) => id).sort();
const expected = [
  'vm:anatomy:body:pelvis:left:bone:left-hip-bone',
  'vm:anatomy:body:pelvis:left:muscle:left-coccygeus',
  'vm:anatomy:body:pelvis:right:bone:right-hip-bone',
  'vm:anatomy:body:pelvis:right:muscle:right-coccygeus',
  'vm:anatomy:body:spine:midline:bone:sacrum',
];
assert.deepEqual(JSON.parse(deltaBytes).changedPins, expected);
assert.equal(JSON.parse(deltaBytes).clinicalDecisionsCopied, false);
assert.deepEqual(changed, expected);
const pins = json(candidate, newPins);
assert.equal(pins.tourRevision, 'coccygeus-pelvic-landmarks-20261027-r1');
assert.deepEqual([...pins.entries, ...pins.contextEntries].map(row => row.id).sort(), expected);
console.log(JSON.stringify({ok:true, candidate, nativeHead:expectedHead,
  oldTours:53, addedDraftTour:expectedTour, stops:4, identities, lessons,
  displayPins:after.size, changedDisplayPins:changed.length,
  decisionSourceUnchanged:true, oldTourModulesChecked:new Set(oldModules).size,
  sourceBound:true}, null, 2));
