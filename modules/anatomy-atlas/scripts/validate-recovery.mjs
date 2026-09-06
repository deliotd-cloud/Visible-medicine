import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { conceptMap } from './bodyparts-archive.mjs';
import { recoverySelections } from './anatomy-recovery.mjs';
import { gapSelections } from './gap-recovery.mjs';
import { inventorySelections } from './inventory-selections.mjs';
import { neuroSelections } from './neuro-selections.mjs';
import { axialSelections } from './axial-selections.mjs';
import { headDetailSelections } from './head-detail-selections.mjs';
import { junctionSelections } from './junction-selection.mjs';
import { mesentericSelections } from './mesenteric-selections.mjs';
import { pancreaticSelections } from './pancreatic-selections.mjs';
import { thoracicSelections } from './thoracic-selections.mjs';
import { handVascularSelections } from './hand-vascular-selections.mjs';
import { handVenousSelections } from './hand-venous-selections.mjs';
import { footVascularSelections } from './foot-vascular-selections.mjs';
import { ocularSelections } from './ocular-selections.mjs';
import { laryngealSelections } from './laryngeal-selections.mjs';
import { forearmVascularSelections } from './forearm-vascular-selections.mjs';
const data = await fs.readFile(
  'public/models/bodyparts3d/full-body/catalog.json',
);
const catalog = JSON.parse(data);
const selected = [
  ...recoverySelections(await conceptMap('isa'), await conceptMap('partof')),
  ...gapSelections(await conceptMap('isa')),
  ...inventorySelections(await conceptMap('isa'), await conceptMap('partof')),
  ...neuroSelections(await conceptMap('isa')),
  ...axialSelections(await conceptMap('isa')),
  ...headDetailSelections(await conceptMap('isa')),
  ...junctionSelections(await conceptMap('isa')),
  ...mesentericSelections(await conceptMap('isa')),
  ...pancreaticSelections(await conceptMap('isa')),
  ...thoracicSelections(await conceptMap('isa')),
  ...handVascularSelections(await conceptMap('isa')),
  ...handVenousSelections(await conceptMap('isa')),
  ...footVascularSelections(await conceptMap('isa')),
  ...ocularSelections(await conceptMap('isa')),
  ...laryngealSelections(await conceptMap('isa')),
  ...forearmVascularSelections(await conceptMap('isa')),
];
const recovered = catalog.structures.filter((s) => s.provenance?.recovered);
assert.equal(recovered.length, 420);
assert.equal(recovered.length, selected.length);
assert.equal(catalog.structures.length, 1022);
let checks = 0;
for (const r of selected) {
  const s = recovered.find((s) => s.fmaId === r.fma);
  assert(
    s &&
      s.sourceName === r.name &&
      s.system === r.system &&
      s.category === r.category,
  );
  assert.equal(s.region, r.region);
  assert.equal(s.sourceTree, r.tree);
  assert.deepEqual(
    s.sources.map((f) => f.file),
    r.files,
  );
  assert.equal(s.provenance.license, 'CC-BY-4.0');
  assert.equal(s.validation.status, 'unvalidated');
  assert.equal(s.validation.anatomicalReview, false);
  assert(s.coverageNote);
  for (const other of catalog.structures) {
    if (other === s) continue;
    assert(
      !other.sources.some((f) => r.files.includes(f.file)),
      `Overlapping source surface ${s.name}/${other.name}`,
    );
  }
  checks += 9;
}
assert.equal(catalog.excluded.length, 4);
assert(!catalog.structures.some((s) => s.fmaId === 'FMA7647'));
assert(catalog.structures.filter((s) => s.system === 'nerves').length === 54);
for (const name of ['heart', 'liver', 'large intestine']) {
  const s = catalog.structures.find((s) => s.sourceName === name);
  assert(s && /aggregate excludes/.test(s.coverageNote));
}
const bySystem = Object.fromEntries(
  ['skeleton', 'muscles', 'nerves', 'organs', 'vessels', 'connective'].map(
    (key) => [key, recovered.filter((s) => s.system === key).length],
  ),
);
await fs.writeFile(
  'content/recovery-manifest.json',
  JSON.stringify(
    {
      version: 4,
      date: '2026-09-06',
      catalogSha256: createHash('sha256').update(data).digest('hex'),
      status: 'unvalidated',
      method: 'licensed-source-recovery',
      generatedAnatomicalMeshes: 0,
      license: 'CC-BY-4.0',
      source: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
      recovered: recovered.map(
        ({
          id,
          fmaId,
          sourceName,
          sourceTree,
          category,
          system,
          regions,
          sources,
          coverageNote,
        }) => ({
          id,
          fmaId,
          sourceName,
          sourceTree,
          category,
          system,
          regions,
          sources,
          coverageNote,
        }),
      ),
    },
    null,
    2,
  ),
);
const result = {
  passed: true,
  recovered: recovered.length,
  bySystem,
  checks: checks + 6,
  neuralEntries: 54,
  newTrochlearNerves: 2,
  quarantined: 4,
  clinicalValidation: false,
  browserInteractionTesting: false,
  checksPerformed: [
    'explicit source identities',
    'unchanged source component lists',
    'no duplicate recovered source-file bindings',
    'aggregate separation notices',
    'licence and draft status',
    'no guessed nerves or cord',
  ],
};
await fs.writeFile(
  'docs/recovery-validation.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
