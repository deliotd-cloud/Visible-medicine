import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { contentContext, contentRoot } from './content-contract-tools.mjs';
import { authoringBeforePelvicOrganImaging, pelvicOrganContentHash as hash } from './pelvic-organ-imaging-history.mjs';
import pins from '../content/pelvic-organ-imaging-pins.json' with { type: 'json' };
import after from '../content/pelvic-organ-imaging.transition.json' with { type: 'json' };

const context = await contentContext(), { api, catalog } = context;
const display = api.bodyDisplayCatalog(catalog), original = JSON.stringify(catalog);
const before = authoringBeforePelvicOrganImaging(context);
let restored = 0, preserved = 0, rejected = 0;
for (const structure of display.structures) {
  const entry = pins.entries.find(e => e.identity.id === structure.id);
  for (const tab of api.contentTabs) {
    if (entry?.topics.includes(tab)) {
      assert.deepEqual(before.bodyLesson(structure, tab), entry.previous[tab]);
      const { readiness, ...content } = entry.previous[tab];
      assert.deepEqual(before.bodyContent(structure, tab), content);
      assert.equal(api.bodyLesson(structure, tab).readiness, 'draft');
      const copy = before.bodyLesson(structure, tab);
      copy.body = 'caller mutation';
      assert.deepEqual(before.bodyLesson(structure, tab), entry.previous[tab]);
      restored++;
    } else {
      assert.deepEqual(before.bodyLesson(structure, tab), api.bodyLesson(structure, tab));
      preserved++;
    }
  }
}
assert.equal(restored, 44);
assert.equal(preserved, display.structures.length * api.contentTabs.length - 44);
assert.strictEqual(before.structures, api.structures);
assert.strictEqual(before.dissectionProfiles, api.dissectionProfiles);
for (const entry of pins.entries) for (const tab of entry.topics) {
  const badApi = { ...api, bodyLesson(s, t) {
    const result = api.bodyLesson(s, t);
    return s.id === entry.identity.id && t === tab ? { ...result, body: result.body + ' altered' } : result;
  }};
  assert.throws(() => authoringBeforePelvicOrganImaging({ api: badApi, catalog }), /Unrecorded pelvic-organ imaging change/);
  rejected++;
}
for (const mutate of [
  s => { s.name += ' altered'; }, s => { s.fmaId = 'FMA000'; },
  s => { s.laterality = 'left'; }, s => { s.sourceTree = 'foreign'; },
  s => { s.sources[0].sha256 = 'altered'; }, s => { s.sources[0].file = 'foreign'; },
  s => { s.bounds.min[0] += 1; }, s => { s.anchor[0] += 1; },
  s => { s.nodeName += 'foreign'; }, s => { s.bundle = 'foreign'; },
  s => { s.validation.anatomicalReview = true; },
]) {
  const bad = structuredClone(pins.entries[0].identity); mutate(bad);
  assert.throws(() => before.bodyLesson(bad, 'ct'), /different pelvic source/);
  const badCatalog = structuredClone(catalog);
  Object.assign(badCatalog.structures.find(s => s.id === bad.id), bad);
  assert.throws(() => authoringBeforePelvicOrganImaging({ api, catalog: badCatalog }));
  rejected += 2;
}
for (const mutate of [
  c => { c.sourceVersion += 1; }, c => { c.license = 'foreign'; },
  c => { c.coordinateSystem.units = 'foreign'; },
  c => { c.bundles.find(b => b.id === pins.bundles[0].id).sha256 = 'foreign'; },
]) {
  const badCatalog = structuredClone(catalog); mutate(badCatalog);
  assert.throws(() => authoringBeforePelvicOrganImaging({ api, catalog: badCatalog }));
  rejected++;
}
assert.equal(JSON.stringify(catalog), original);

// Optional independent Git replay: compile every application import from the
// exact original commits, never current-source fallbacks or approval records.
let originalSourceVerified = false;
if (process.argv.includes('--verify-source')) {
  const root = fileURLToPath(contentRoot);
  async function sourceApi(commit) {
    const compiled = await build({
      stdin: { contents: "export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {dissectionProfiles} from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';", resolveDir: root, loader: 'ts' },
      bundle: true, write: false, platform: 'node', format: 'esm',
      plugins: [{ name: 'exact-pelvic-history', setup(builder) {
        builder.onLoad({ filter: /.*/, namespace: 'workspace-test' }, args => {
          const path = relative(root, args.path).replaceAll('\\', '/');
          if (path.startsWith('node_modules/')) return;
          assert(!path.startsWith('../'));
          return { contents: execFileSync('git', ['show', commit + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 16e6 }), loader: ({ '.ts':'ts', '.tsx':'tsx', '.json':'json' })[extname(path)] || 'js', resolveDir: dirname(args.path) };
        });
      }}],
    });
    return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  }
  const previous = await sourceApi(pins.sourceCommit), authored = await sourceApi(after.sourceCommit);
  assert.deepEqual(authored.bodyDisplayCatalog(catalog), previous.bodyDisplayCatalog(catalog));
  const snapshot = historical => ({
    body: historical.bodyDisplayCatalog(catalog).structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, historical.bodyLesson(s, t)])) })),
    shoulder: historical.structures, recipes: historical.dissectionProfiles,
  });
  assert.equal(hash(snapshot(previous)), pins.previousAllLessonsAndRecipesHash, 'Original pre-addition teaching/recipes');
  assert.deepEqual(snapshot(authoringBeforePelvicOrganImaging({ api: authored, catalog })), snapshot(previous));
  for (const [i, entry] of pins.entries.entries()) for (const tab of entry.topics) {
    assert.deepEqual(previous.bodyLesson(entry.identity, tab), entry.previous[tab]);
    assert.equal(hash(authored.bodyLesson(entry.identity, tab)), after.entries[i].sections[tab]);
  }
  originalSourceVerified = true;
}
console.log(JSON.stringify({ selections: pins.entries.length, restored, preserved, rejected, originalSourceVerified, currentLessonsChanged: false, approvalsMigrated: false }));
