import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const catalog = JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
);
const baseline = JSON.parse(
  await fs.readFile('content/hand-venous-baseline.json', 'utf8'),
);
const result = await build({
  entryPoints: ['lib/anatomy-vessels.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const api = await import(
  'data:text/javascript;base64,' +
    Buffer.from(result.outputFiles[0].text).toString('base64')
);
let checks = 0;
const same = (a, b) => {
  checks++;
  assert.deepEqual(a, b);
};
const oldIds = new Set(baseline.structures.map((s) => s.id));
let oldVessels = 0;
for (const s of catalog.structures) {
  if (s.system !== 'vessels') {
    same(api.vesselKind(s), 'unclassified');
    continue;
  }
  if (oldIds.has(s.id)) {
    oldVessels++;
    same(
      api.vesselColor(s),
      /vein|vena cava/.test(s.sourceName) ? '#577fba' : '#bf4847',
    );
  } else {
    same(s.bundle.endsWith('-hand-venous'), true);
    same(api.vesselKind(s), 'vein');
    same(api.vesselColor(s), '#577fba');
  }
}
same(oldVessels, 201);
const identity = (sourceName, fmaId = 'FMA999999', system = 'vessels') => ({
  sourceName,
  fmaId,
  system,
});
for (const name of [
  'venous arch',
  'VEINS',
  'Vena cava',
  'venae',
  'pulmonary vein',
  'dorsal venous network',
])
  same(api.vesselKind(identity(name)), 'vein');
for (const name of [
  'artery',
  'ARTERIES',
  'arteria princeps pollicis',
  'aorta',
  'aortic branch',
  'pulmonary artery',
])
  same(api.vesselKind(identity(name)), 'artery');
for (const name of [
  '',
  'vessel',
  'unknown trunk',
  'venous artery',
  'vein arterial branch',
  'arterialized',
  'veinlike',
  'right deep palmar arch',
])
  same(api.vesselKind(identity(name)), 'unclassified');
same(api.vesselKind(identity('right deep palmar arch', 'FMA22839')), 'artery');
same(api.vesselKind(identity('wrong label', 'FMA22839')), 'unclassified');
same(api.vesselKind(identity('artery', 'FMA999999', 'nerves')), 'unclassified');
same(api.vesselColor(identity('unknown trunk')), '#8b94a1');
const scene = await fs.readFile('app/body-scene.tsx', 'utf8');
same(
  scene.includes("if (s.system === 'vessels') return vesselColor(s);"),
  true,
);
same(scene.includes('/vein|vena cava/'), false);
const legend = await fs.readFile('app/body-explorer.tsx', 'utf8');
same(legend.includes('grey = unclassified vessel'), true);
same(legend.includes('not oxygenation'), true);
const evidence = {
  passed: true,
  checks,
  unchangedVessels: oldVessels,
  venousAdditions: 14,
  geometryChanged: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/vessel-colour-validation.json',
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(evidence);
