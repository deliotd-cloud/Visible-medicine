// Offline reconstruction only. Never migrates approvals or changes runtime content.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { reviewDocumentBeforeModelDelivery } from './model-delivery-history.mjs';
import { quizQuestions } from '../app/anatomy-data.ts';
import { authoringBeforeSpineImaging } from './spine-imaging-history.mjs';
import transition from '../content/xray-transition.json' with { type: 'json' };
const hash = (v) => createHash('sha256').update(v).digest('hex');
const encode = (v) => JSON.stringify(v, null, 2) + '\n';
const withoutXray = (structures) =>
  structures.map((s) => {
    const { xray, ...sections } = s.sections;
    return { ...s, sections };
  });
assert.equal(
  transition.sourceCommit,
  'a1b9c5719d5059e75cf2e93e84e45b208764fffb',
);
assert.equal(
  transition.beforeReviewHash,
  '4e130ad0c0a5ec170069ae5ed89b1f3aab401f37282048d648f82f8f293c2104',
);
assert.equal(
  transition.afterReviewHash,
  '333fc59956b21e4a8198a90be8764774d81ca1c170d4b9b36636e180e8357c15',
);
assert.equal(
  transition.xrayTeachingHash,
  'a97bf0587b38ffaea3fe160ded6840cf15f23e892722e60aeb87109374466f1c',
);

export function authoringBeforeXray({ api, catalog }) {
  api = authoringBeforeSpineImaging({ api, catalog });
  assert.equal(
    hash(
      JSON.stringify({
        body: catalog.structures.map((s) => [s.id, api.bodyLesson(s, 'xray')]),
        shoulder: api.structures.map((s) => [s.id, s.sections.xray]),
      }),
    ),
    transition.xrayTeachingHash,
    'Unrecorded X-ray authoring change',
  );
  return {
    ...api,
    contentTabs: api.contentTabs.filter((t) => t !== 'xray'),
    structures: withoutXray(api.structures),
  };
}

export async function reviewDocumentBeforeXray(
  revisions,
  manifest,
  structures,
) {
  revisions = await reviewDocumentBeforeModelDelivery(revisions, manifest, structures);
  assert.equal(
    hash(encode(revisions)),
    transition.afterReviewHash,
    'Exact X-ray review transition',
  );
  const old = structuredClone(revisions),
    displayBefore = new Map(transition.displayBefore);
  assert.deepEqual(
    [...displayBefore.keys()],
    [
      'app/shoulder-explorer.tsx',
      'app/atlas-workspace.tsx',
      'app/atlas-workspace.css',
    ],
  );
  old.display = old.display.map(([p, h]) => [p, displayBefore.get(p) ?? h]);
  for (const s of structures)
    assert.equal(
      revisions.revisions[s.id].teaching,
      hash(JSON.stringify({ structure: s, quizQuestions })),
      'Stale current teaching',
    );
  for (const s of withoutXray(structures)) {
    old.revisions[s.id].teaching = hash(
      JSON.stringify({ structure: s, quizQuestions }),
    );
    old.revisions[s.id].geometry = hash(
      JSON.stringify({
        model: manifest.sha256,
        manifest,
        display: old.display,
        identity: { id: s.id, name: s.name, latinName: s.latinName },
      }),
    );
    assert.notEqual(
      old.revisions[s.id].teaching,
      revisions.revisions[s.id].teaching,
    );
    assert.notEqual(
      old.revisions[s.id].geometry,
      revisions.revisions[s.id].geometry,
    );
    assert.equal(old.revisions[s.id].imaging, null);
  }
  assert.equal(
    hash(encode(old)),
    transition.beforeReviewHash,
    'Exact preceding review document; no approval migration',
  );
  return old;
}
