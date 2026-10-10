import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeLumbarDiscMri } from './lumbar-disc-mri-history.mjs';
import transition from '../content/lumbar-disc-mri-revision.transition.json' with { type: 'json' };
import thoracic from '../content/thoracic-disc-mri-revision.transition.json' with { type: 'json' };
import cervical from '../content/cervical-disc-mri-revision.transition.json' with { type: 'json' };
import { beforeThoracicDiscMri } from './thoracic-disc-mri-history.mjs';

const root = resolve(process.cwd());
for (const name of ['spine-imaging-pins.json', 'spine-imaging.before.json']) {
  const text = await readFile(resolve(root, 'content', name), 'utf8');
  assert.equal(JSON.stringify(JSON.parse(text.replaceAll('\n', '\r\n'))), JSON.stringify(JSON.parse(text)), name + ' CRLF checkout preserves immutable parsed content');
}
const { build } = await import(pathToFileURL(resolve(root, 'scripts/workspace-test-build.mjs')).href);
const oldSource = execFileSync('git', ['show', `${transition.baselineCommit}:content/spine-imaging-concepts.ts`], {cwd: root, encoding: 'utf8'});
const newSource = await readFile(resolve(root, 'content/spine-imaging-concepts.ts'), 'utf8');
const entry = `export {spineImagingLesson} from './lib/spine-imaging.ts';\nexport {spineImagingTopics,spineImagingReferences} from './content/spine-imaging-concepts.ts';`;
async function load(contents) {
  const result = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'one-source-override', setup(api) {
      api.onLoad({ filter: /[\\/]content[\\/]spine-imaging-concepts\.ts$/, namespace: 'workspace-test' }, () => ({ contents, loader: 'ts', resolveDir: resolve(root, 'content') }));
    } }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const oldModule = await load(oldSource);
const newModule = await load(newSource);
const catalog = { structures: [...transition.entries,...thoracic.entries,...cervical.entries].map((entry) => entry.identity) };
const apiFor = (module) => ({
  ...module,
  bodyLesson: (s, tab) => module.spineImagingLesson(s, tab),
  bodyContent: (s, tab) => { const lesson = module.spineImagingLesson(s, tab); if (!lesson) return undefined; const { readiness: _readiness, ...shown } = lesson; return shown; },
});
// Keep the original lumbar assertions against their exact epoch after the
// separately guarded later thoracic revision has been reversed.
const old = apiFor(oldModule), current = beforeThoracicDiscMri(apiFor(newModule),catalog);
const restored = beforeLumbarDiscMri(current, catalog);
assert.equal(beforeLumbarDiscMri(old, catalog), old, 'Recorded old epoch is idempotent');
for (const entry of transition.entries) {
  assert.deepEqual(restored.spineImagingLesson(entry.identity, 'mri'), entry.oldLesson);
  assert.deepEqual(restored.bodyLesson(entry.identity, 'mri'), entry.oldLesson);
  const { readiness: _readiness, ...shown } = entry.oldLesson;
  assert.deepEqual(restored.bodyContent(entry.identity, 'mri'), shown);
  const foreign = structuredClone(entry.identity); foreign.name += ' foreign';
  assert.throws(() => restored.spineImagingLesson(foreign, 'mri'));
  assert.throws(() => restored.bodyLesson(foreign, 'mri'));
  assert.throws(() => restored.bodyContent(foreign, 'mri'));
}

let refusals = 0;
const reject = (api, source = catalog) => { assert.throws(() => beforeLumbarDiscMri(api, source)); refusals++; };
for (const field of ['body', 'bullets', 'references']) {
  const topics = structuredClone(current.spineImagingTopics);
  if (field === 'body') topics.lumbarDisc.mri.body += ' foreign';
  else if (field === 'bullets') topics.lumbarDisc.mri.bullets[0] += ' foreign';
  else topics.lumbarDisc.mri.references[0] = 'disc';
  reject({ ...current, spineImagingTopics: topics });
}
reject({ ...current, spineImagingReferences: { ...current.spineImagingReferences, lumbarDiscNomenclature: 'https://foreign.example/' } });
const otherTopics = structuredClone(current.spineImagingTopics); otherTopics.atlas.mri.body += ' foreign';
reject({ ...current, spineImagingTopics: otherTopics });
reject({ ...current, spineImagingReferences: { ...current.spineImagingReferences, mri: 'https://foreign.example/' } });
reject({ ...current, spineImagingLesson: () => transition.entries[0].oldLesson });
reject({ ...current, bodyLesson: () => transition.entries[0].oldLesson });
reject({ ...current, bodyContent: () => ({ body: 'foreign' }) });
reject({ ...current, spineImagingReferences: undefined });
reject({ ...current, bodyLesson: (s, tab) => s.id === transition.entries[0].identity.id ? transition.entries[0].oldLesson : current.bodyLesson(s, tab) });
const foreignCatalog = structuredClone(catalog); foreignCatalog.structures[0].name += ' foreign';
reject(current, foreignCatalog);

const omittedOld = { bodyLesson: old.bodyLesson, bodyContent: old.bodyContent };
assert.equal(beforeLumbarDiscMri(omittedOld, catalog), omittedOld);
const omittedPending = {
  bodyLesson: (s, tab) => transition.entries.find((entry) => entry.identity.id === s.id)?.pendingLesson,
  bodyContent: (s, tab) => { const lesson = transition.entries.find((entry) => entry.identity.id === s.id)?.pendingLesson; if (!lesson) return undefined; const { readiness: _readiness, ...shown } = lesson; return shown; },
};
assert.equal(beforeLumbarDiscMri(omittedPending, catalog), omittedPending);
reject({ bodyLesson: current.bodyLesson, bodyContent: current.bodyContent });
const omittedMixed = { bodyLesson: (s, tab) => s.id === transition.entries[0].identity.id ? transition.entries[0].oldLesson : current.bodyLesson(s, tab) };
reject(omittedMixed, catalog);
reject({ bodyLesson: (s) => s.id === transition.entries[0].identity.id ? transition.entries[0].pendingLesson : transition.entries.find((entry) => entry.identity.id === s.id)?.oldLesson }, catalog);
reject({ bodyLesson: () => ({ readiness: 'pending' }) }, catalog);
const early = {};
assert.equal(beforeLumbarDiscMri(early), early);
const earlyUndefined = { bodyLesson: () => undefined, bodyContent: () => undefined };
assert.equal(beforeLumbarDiscMri(earlyUndefined), earlyUndefined);
reject({ bodyLesson: () => undefined, bodyContent: () => ({ body: 'forged learner content' }) }, undefined);
reject({ bodyLesson: () => undefined, bodyContent: 7 }, undefined);
reject({ bodyLesson: () => ({ readiness: 'draft' }) });

console.log(JSON.stringify({ fullOldNewLessons: 5, alteredSourceRefusals: 15, forgedEpochRefusals: refusals, restoredOldEpoch: true }));
