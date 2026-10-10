import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './workspace-test-build.mjs';
import { contentRoot, readContentJson } from './content-contract-tools.mjs';

const root = fileURLToPath(contentRoot);
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const epochs = {
  beforeShoulder: '4a180683536f6c67035d0cfca54aac9f91cb0fc1',
  beforeForearm: 'c8cd866894e0254c0a92cd5d0b5f7012ccd25714',
  completedForearm: 'bb8504c368a09d3455f0fde460106dccfa91bd31',
};

async function curriculumAt(commit) {
  const bundled = await build({
    stdin: {
      contents: `export { bodyLesson, bodyContent } from './app/body-content';
export { structures } from './app/anatomy-data';
export { dissectionProfiles } from './app/dissection-data';
export { contentTabs } from './lib/content-types';`,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    plugins: [{
      name: 'completed-curriculum-git-epoch',
      setup(builder) {
        builder.onLoad({ filter: /.*/, namespace: 'workspace-test' }, (args) => {
          const path = relative(root, args.path).replaceAll('\\', '/');
          assert(path !== '..' && !path.startsWith('../'));
          if (path.startsWith('node_modules/')) return;
          return {
            contents: execFileSync('git', ['show', `${commit}:${path}`], {
              cwd: root, encoding: 'utf8', maxBuffer: 32e6,
              windowsHide: true, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
            }),
            loader: { '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' }[extname(path)] || 'js',
            resolveDir: dirname(args.path),
          };
        });
      },
    }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
}

function exactCopy(api, catalog) {
  return {
    body: catalog.structures.map((s) => ({
      id: s.id,
      sections: Object.fromEntries(api.contentTabs.map((tab) => [tab, api.bodyContent(s, tab)])),
    })),
    shoulder: api.structures,
    dissectionProfiles: api.dissectionProfiles,
  };
}

function checkTransition(before, transition, priorApi, authoredApi, catalog, count, region) {
  assert.equal(before.entries.length, count);
  assert.equal(transition.entries.length, count);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.scope, 'body');
  assert.equal(new Set(before.entries.map((entry) => entry.id)).size, count);
  assert.deepEqual(
    transition.entries.map((entry) => [entry.id, entry.fmaId]),
    before.entries.map((entry) => [entry.id, entry.fmaId]),
  );
  let sections = 0;
  for (const [index, entry] of before.entries.entries()) {
    const s = catalog.structures.find((item) => item.id === entry.id);
    assert(s && s.system === 'muscles' && s.regions.includes(region));
    assert.equal(s.fmaId, entry.fmaId);
    assert.equal(s.name, entry.name);
    for (const tab of before.tabs) {
      const previous = priorApi.bodyLesson(s, tab);
      const authored = authoredApi.bodyLesson(s, tab);
      assert.deepEqual(previous, entry.sections[tab], `Exact previous ${region}: ${s.id} ${tab}`);
      assert.equal(previous.readiness, tab === 'anatomy' ? 'identity-only' : 'pending');
      assert.equal(authored.readiness, 'draft');
      assert.equal(hash(authored), transition.entries[index].sections[tab], `Pinned authored ${region}: ${s.id} ${tab}`);
      const { readiness: _readiness, ...display } = authored;
      assert.deepEqual(authoredApi.bodyContent(s, tab), display);
      sections++;
    }
  }
  assert.equal(sections, count * 2);
  return sections;
}

/** Prove the completed shoulder and forearm changes at their own Git epochs.
 * Newer teaching is checked independently by the current content contract. */
export async function verifyCompletedCurriculumEpochs({ catalog }) {
  const [shoulderBefore, shoulderTransition, forearmBefore, forearmTransition, handBefore] = await Promise.all([
    'content/shoulder-arm-curriculum.before.json',
    'content/shoulder-arm-curriculum.transition.json',
    'content/forearm-curriculum.before.json',
    'content/forearm-curriculum.transition.json',
    'content/hand-curriculum.before.json',
  ].map(readContentJson));
  assert.equal(hash(shoulderBefore), 'da637d0b7d95bdeb2428cad45e8bd6e8c47016a33e3d95229c3ca155ae68e99d');
  assert.equal(hash(shoulderTransition), 'cdcf762dfad6ae1330096748af57c9ca38ba699909c0052258a1a399d347f497');
  assert.equal(hash(forearmBefore), '443f8440d4d8d1be167b8de621fb562f0e8315c7ca43031d2affc2cd1d34d2c6');
  assert.equal(hash(forearmTransition), 'ec16ddf412ef25209111e5d57f2036d3d778149c1bc94d4fa9dbaf8b33299dde');
  assert.equal(hash(handBefore), '9fcf6daefb2fa8ab9244e552dc347b288708480c8dd21957917b2a1af75bd987');
  assert.equal(shoulderBefore.sourceCommit, epochs.beforeShoulder);
  assert.equal(shoulderTransition.sourceCommit, epochs.beforeShoulder);
  assert.equal(forearmBefore.sourceCommit, epochs.beforeForearm);
  assert.equal(forearmTransition.sourceCommit, epochs.beforeForearm);
  assert.equal(handBefore.sourceCommit, epochs.completedForearm);

  const beforeShoulder = await curriculumAt(epochs.beforeShoulder);
  const beforeForearm = await curriculumAt(epochs.beforeForearm);
  const completedForearm = await curriculumAt(epochs.completedForearm);
  for (const [api, snapshot, label] of [
    [beforeShoulder, shoulderBefore, 'before shoulder'],
    [beforeForearm, forearmBefore, 'before forearm'],
    [completedForearm, handBefore, 'completed forearm'],
  ]) {
    assert.deepEqual(api.contentTabs, ['anatomy', 'function', 'ct', 'mri', 'ultrasound', 'pathology', 'clinical', 'quiz']);
    assert.equal(hash(exactCopy(api, catalog)), snapshot.copyAndRecipeHash, `Complete copy and recipes at ${label} epoch`);
  }
  const shoulderSections = checkTransition(shoulderBefore, shoulderTransition, beforeShoulder, beforeForearm, catalog, 32, 'shoulder-arm');
  const forearmSections = checkTransition(forearmBefore, forearmTransition, beforeForearm, completedForearm, catalog, 42, 'forearm');
  return { epochs, shoulderSections, forearmSections };
}
