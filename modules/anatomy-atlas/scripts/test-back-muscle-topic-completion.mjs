import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';

const baseline = '7d3010368fc53e3433e8df4f9e9d4ddb67e786e8';
const oldClinical = execFileSync('git', ['show', `${baseline}:content/back-layers-clinical.ts`], {encoding: 'utf8', maxBuffer: 32e6});
const topics = ['clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'];
const contents = [
  "export * from './lib/back-layers';",
  "export * from './lib/back-layers-teaching';",
  "export * from './content/back-layers-clinical';",
  "export * from './content/back-layers-teaching';",
  "export {kneeDefinition} from './lib/um-limb-studies';",
].join('\n');
async function load(previous = false) {
  const compiled = await build({
    stdin: {contents, resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: previous ? [{name: 'previous-clinical-content', setup(plugin) {
      plugin.onLoad({filter: /[\\/]content[\\/]back-layers-clinical\.ts$/}, args => ({
        contents: oldClinical, loader: 'ts', resolveDir: dirname(args.path),
      }));
    }}] : [],
  });
  return import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('14 source-checked back muscles have eight grounded topics with previous teaching intact', async () => {
  const now = await load();
  const before = await load(true);
  const definition = now.backLayersDefinition;
  const muscles = definition.surfaces.filter(surface => surface.tissue === 'muscle');
  assert.equal(muscles.length, 14);
  assert.deepEqual(Object.keys(now.backLayersClinical).sort(), ['latissimus', 'multifidus', 'rhomboidMajor', 'rhomboidMinor', 'trapezius']);
  assert.deepEqual(now.backLayersLessonIds, before.backLayersLessonIds);
  assert.deepEqual(now.backLayersPartNotes, before.backLayersPartNotes);
  assert.deepEqual(now.backLayersLessons, before.backLayersLessons);
  const titles = now.backLayersReferences;
  const baselineTopics = Object.values(before.backLayersClinical).reduce((n, lesson) => n + Object.keys(lesson.topics).length, 0);
  assert.equal(baselineTopics, 17);
  assert.equal(Object.values(now.backLayersClinical).reduce((n, lesson) => n + Object.keys(lesson.topics).length, 0), 30);
  let checked = 0;
  for (const surface of muscles) {
    const key = now.backLayersLessonIds[surface.fmaId];
    assert(key, surface.id);
    const current = now.backLayersTeachingFor(definition, surface);
    const prior = before.backLayersTeachingFor(definition, surface);
    assert(current && prior, surface.id);
    assert.deepEqual(current.anatomy, prior.anatomy, surface.id);
    assert.deepEqual(current.function, prior.function, surface.id);
    assert.deepEqual(current.attachments, prior.attachments, surface.id);
    assert.deepEqual(current.references, prior.references, surface.id);
    assert.equal(current.extended.modelLimit, prior.extended.modelLimit, surface.id);
    assert.deepEqual(current.extended.selfCheck, prior.extended.selfCheck, surface.id);
    assert.deepEqual(Object.keys(current.extended.topics).sort(), [...topics].sort(), surface.id);
    for (const [topic, oldDraft] of Object.entries(prior.extended.topics))
      assert.deepEqual(current.extended.topics[topic], oldDraft, `${surface.id}/${topic}: previous authored draft changed`);
    for (const topic of topics) {
      const draft = current.extended.topics[topic];
      assert.equal(draft.readiness, 'draft', `${surface.id}/${topic}`);
      assert(draft.body.length > 100, `${surface.id}/${topic}`);
      assert(draft.references.length > 0, `${surface.id}/${topic}`);
      for (const url of draft.references) {
        assert.equal(new URL(url).protocol, 'https:', url);
        assert(titles[url], `${surface.id}/${topic}: missing reading title ${url}`);
      }
    }
    const snapshot = structuredClone(current);
    current.anatomy = 'changed';
    current.extended.topics.ct.body = 'changed';
    current.extended.topics.ultrasound.references.push('https://example.invalid');
    current.extended.selfCheck.answer = 'changed';
    assert.deepEqual(now.backLayersTeachingFor(definition, surface), snapshot, `${surface.id}: detached return`);
    for (const field of ['id', 'fmaId', 'sourceName', 'laterality', 'tissue', 'bundle', 'nodeName'])
      assert.equal(now.backLayersTeachingFor(definition, {...surface, [field]: 'foreign'}), null, `${surface.id}/${field}`);
    checked++;
  }
  assert.equal(checked, 14);
  assert.equal(now.backLayersTeachingFor(now.kneeDefinition, muscles[0]), null);
  assert.equal(now.backLayersTeachingFor(definition, now.kneeDefinition.surfaces[0]), null);
  const minor = now.backLayersClinical.rhomboidMinor;
  assert.match(minor.topics.pathology.body, /did not establish a minor tear/);
  assert.match(minor.topics.ultrasound.body, /does not validate an isolated minor tear/);
});
