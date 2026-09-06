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
  } else if (s.bundle.endsWith('-foot-vascular')) {
    const expected = {
      FMA43943: 'artery',
      FMA43944: 'artery',
      FMA69514: 'artery',
      FMA69515: 'artery',
      FMA43937: 'artery',
      FMA43938: 'artery',
      FMA44881: 'vein',
      FMA44882: 'vein',
    }[s.fmaId];
    same(typeof expected, 'string');
    same(api.vesselKind(s), expected);
    same(api.vesselColor(s), expected === 'artery' ? '#bf4847' : '#577fba');
  } else if (s.bundle.endsWith('-forearm-vascular')) {
    same(
      ['FMA22807', 'FMA22808', 'FMA268667', 'FMA268669'].includes(s.fmaId),
      true,
    );
    same(api.vesselKind(s), 'artery');
    same(api.vesselColor(s), '#bf4847');
  } else {
    same(s.bundle.endsWith('-hand-venous'), true);
    same(api.vesselKind(s), 'vein');
    same(api.vesselColor(s), '#577fba');
  }
}
same(oldVessels, 201);
same(
  catalog.structures.filter((s) => s.bundle.endsWith('-forearm-vascular'))
    .length,
  4,
);
same(
  catalog.structures.filter((s) => s.bundle.endsWith('-hand-venous')).length,
  14,
);
same(
  catalog.structures.filter((s) => s.bundle.endsWith('-foot-vascular')).length,
  8,
);
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
same(api.vesselKind(identity('right plantar arch', 'FMA43943')), 'artery');
same(api.vesselKind(identity('left plantar arch', 'FMA43944')), 'artery');
same(api.vesselKind(identity('right plantar arch')), 'unclassified');
same(api.vesselKind(identity('unknown vessel', 'FMA43943')), 'unclassified');
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
  footVesselAdditions: 8,
  geometryChanged: false,
  browserInteractionTesting: false,
};
await fs.writeFile(
  'docs/vessel-colour-validation.json',
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(evidence);
