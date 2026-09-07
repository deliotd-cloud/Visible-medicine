import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
import { authoringBeforeForearm } from './forearm-curriculum-transition.mjs';

export const curriculumHash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Keep the original all-copy baseline intact. First unwind the later forearm
 * transition, then these 64 explicitly pinned sections to the original snapshot
 * so callers can still reject any unrelated copy/recipe edit. */
export async function copyBeforeShoulderArmCurriculum(context) {
  const { catalog } = context;
  const api = await authoringBeforeForearm(context);
  const before = await readContentJson(
    'content/shoulder-arm-curriculum.before.json',
  );
  const transition = await readContentJson(
    'content/shoulder-arm-curriculum.transition.json',
  );
  assert.equal(
    curriculumHash(before),
    'da637d0b7d95bdeb2428cad45e8bd6e8c47016a33e3d95229c3ca155ae68e99d',
    'Immutable original curriculum sections',
  );
  assert.equal(
    curriculumHash(transition),
    'cdcf762dfad6ae1330096748af57c9ca38ba699909c0052258a1a399d347f497',
    'Explicit approved-for-authoring transition, not clinical approval',
  );
  assert.equal(before.sourceCommit, '4a180683536f6c67035d0cfca54aac9f91cb0fc1');
  assert.equal(transition.sourceCommit, before.sourceCommit);
  assert.equal(before.entries.length, 32);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.deepEqual(
    transition.entries.map((s) => [s.id, s.fmaId]),
    before.entries.map((s) => [s.id, s.fmaId]),
  );
  const targets = new Map(
    before.entries.map((s, i) => [
      s.id,
      { before: s, after: transition.entries[i] },
    ]),
  );
  assert.equal(targets.size, 32);
  let restored = 0;
  const body = catalog.structures.map((s) => {
    const target = targets.get(s.id);
    if (target) {
      assert.equal(s.fmaId, target.before.fmaId);
      assert.equal(s.name, target.before.name);
      assert.equal(s.system, 'muscles');
      assert(s.regions.includes('shoulder-arm'));
    }
    return {
      id: s.id,
      sections: Object.fromEntries(
        api.contentTabs.map((tab) => {
          if (!target || !before.tabs.includes(tab))
            return [tab, api.bodyContent(s, tab)];
          assert.equal(
            curriculumHash(api.bodyLesson(s, tab)),
            target.after.sections[tab],
            'Pinned authored section: ' + s.id + ' ' + tab,
          );
          assert.equal(api.bodyLesson(s, tab).readiness, 'draft');
          const { readiness, ...section } = target.before.sections[tab];
          assert.equal(
            readiness,
            tab === 'anatomy' ? 'identity-only' : 'pending',
          );
          restored++;
          return [tab, section];
        }),
      ),
    };
  });
  assert.equal(restored, 64);
  return {
    body,
    shoulder: api.structures,
    dissectionProfiles: api.dissectionProfiles,
  };
}
