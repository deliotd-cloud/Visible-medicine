import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { build } from './workspace-test-build.mjs';
import { bodyOffset, translatedBox, fitBounds } from '../lib/explode-layout.mjs';
// Use the same confined TypeScript resolver as the other pure-helper suites.
// Direct Node imports cannot resolve the application's extensionless imports.
// Bundle the real helpers; retain every assertion and use no runtime stubs.
const compiled = await build({
  stdin: {
    contents: `export * from './lib/study-library';
export * from './lib/body-display-catalog';
export * from './app/dissection-data';`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const {
  studyLibrary,
  bodyDisplayCatalog,
  dissectionProfiles,
  stageStructures,
  initialDissection,
  dissectionReducer,
  resolveDissection,
  matchesRule,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const catalog = bodyDisplayCatalog(JSON.parse(
  await fs.readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8'),
));
const rows = [];
let checks = 0,
  cameraChecks = 0;
for (const [region, profile] of Object.entries(dissectionProfiles)) {
  assert(profile.limitations.length >= 2);
  assert(profile.stages.length >= 4);
  assert.equal(
    new Set(profile.stages.map((s) => s.id)).size,
    profile.stages.length,
  );
  for (const side of ['both', 'right', 'left']) {
    const scope = catalog.structures.filter(
      (s) =>
        (region === 'whole-body' || s.regions.includes(region)) &&
        (side === 'both' ||
          s.laterality === side ||
          ['midline', 'unpaired', 'unspecified'].includes(s.laterality)),
    );
    let prior = scope;
    for (const stage of profile.stages) {
      const visible = stageStructures(scope, profile, stage.id);
      assert(visible.length > 0, `Empty stage: ${region}/${stage.id}/${side}`);
      assert(visible.every((s) => scope.includes(s)));
      if (stage.kind === 'assembled')
        assert.equal(visible.length, scope.length);
      if (stage.kind === 'skeleton')
        assert(visible.every((s) => s.system === 'skeleton'));
      if (stage.kind === 'peel') {
        assert(
          visible.length < prior.length,
          `No-op peel: ${region}/${stage.id}/${side}`,
        );
        assert(
          visible.every((s) => prior.includes(s)),
          `Peel unexpectedly restores tissue: ${region}/${stage.id}`,
        );
      }
      for (const landmark of stage.landmarks)
        assert(
          visible.some((s) => new RegExp(landmark, 'i').test(s.sourceName)),
          `Missing landmark ${region}/${stage.id}/${landmark}/${side}`,
        );
      let state = dissectionReducer(initialDissection, {
        type: 'stage',
        id: stage.id,
      });
      const target = visible[0];
      const before = resolveDissection(scope, profile, state);
      state = dissectionReducer(state, { type: 'remove', id: target.id });
      assert(
        !resolveDissection(scope, profile, state).visible.some(
          (s) => s.id === target.id,
        ),
      );
      state = dissectionReducer(state, { type: 'undo' });
      assert.deepEqual(
        resolveDissection(scope, profile, state).visible.map((s) => s.id),
        before.visible.map((s) => s.id),
      );
      const removed = before.removed[0];
      if (removed) {
        state = dissectionReducer(state, { type: 'restore', id: removed.id });
        assert(
          resolveDissection(scope, profile, state).visible.some(
            (s) => s.id === removed.id,
          ),
        );
        state = dissectionReducer(state, { type: 'undo' });
        assert.deepEqual(
          resolveDissection(scope, profile, state).visible.map((s) => s.id),
          before.visible.map((s) => s.id),
        );
      }
      checks += 9;
      prior = visible;
      for (const aspect of [0.65, 1.4])
        for (const view of [
          'anterior',
          'posterior',
          'right',
          'left',
          'inferior',
          'superior',
        ])
          for (const explode of [0, 100]) {
            const frame = new THREE.Box3();
            for (const s of scope) frame.union(translatedBox(s.bounds));
            const origin = frame.getCenter(new THREE.Vector3());
            const bounds = new THREE.Box3();
            for (const s of visible)
              bounds.union(
                translatedBox(s.bounds, bodyOffset(s.center, origin, explode)),
              );
            const vertical = ['inferior', 'superior'].includes(view);
            const vectors = {
              anterior: [0, 0.04, 1],
              posterior: [0, 0.04, -1],
              right: [-1, 0.04, 0],
              left: [1, 0.04, 0],
              inferior: [0, -1, 0],
              superior: [0, 1, 0],
            };
            const up = new THREE.Vector3(
              0,
              vertical ? 0 : 1,
              view === 'inferior' ? 1 : view === 'superior' ? -1 : 0,
            );
            const { center, distance } = fitBounds(
              bounds,
              new THREE.Vector3(...vectors[view]),
              up,
              aspect,
              38,
            );
            const camera = new THREE.PerspectiveCamera(
              38,
              aspect,
              0.01,
              Math.max(
                150,
                distance + bounds.getSize(new THREE.Vector3()).length() * 4,
              ),
            );
            camera.position
              .copy(center)
              .add(
                new THREE.Vector3(...vectors[view])
                  .normalize()
                  .multiplyScalar(distance),
              );
            camera.up.set(
              0,
              vertical ? 0 : 1,
              view === 'inferior' ? 1 : view === 'superior' ? -1 : 0,
            );
            camera.lookAt(center);
            camera.updateMatrixWorld();
            for (const x of [bounds.min.x, bounds.max.x])
              for (const y of [bounds.min.y, bounds.max.y])
                for (const z of [bounds.min.z, bounds.max.z]) {
                  const p = new THREE.Vector3(x, y, z).project(camera);
                  assert(
                    Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95 && p.z < 1,
                    `Camera framing ${region}/${stage.id}/${view}`,
                  );
                }
            cameraChecks++;
          }
      if (side === 'both')
        rows.push({
          region,
          stage: stage.id,
          kind: stage.kind,
          visible: visible.length,
          removed: scope.length - visible.length,
        });
    }
    for (const focus of profile.focuses) {
      const list = stageStructures(scope, profile, 'free', focus.id);
      const regionalTargets = catalog.structures.filter((s) =>
        (region === 'whole-body' || s.regions.includes(region)) && matchesRule(s, focus.rule));
      assert(regionalTargets.length > 0, `Unresolved focus ${region}/${focus.id}`);
      const targets = scope.filter((s) => matchesRule(s, focus.rule));
      // Bone targets are valid. A side-specific recipe can be unavailable on
      // the opposite side; context alone must not make that recipe available.
      const recipe = studyLibrary(scope, profile).flatMap((card) => card.recipes)
        .find((entry) => entry.kind === 'focus' && entry.id === focus.id);
      assert.equal(recipe.available, targets.length > 0);
      assert(targets.every((s) => list.includes(s)));
      assert(list.every((s) => scope.includes(s)));
      checks++;
    }
  }
}
assert.equal(
  Object.keys(dissectionProfiles).length,
  catalog.regions.length + 1,
);
assert.equal(
  catalog.structures.find((s) => s.fmaId === 'FMA7202').region,
  'abdomen',
);
assert.equal(
  catalog.structures.find((s) => s.fmaId === 'FMA19728').region,
  'pelvis',
);
assert(
  !catalog.structures.some((s) =>
    ['FMA37388', 'FMA37389', 'FMA46633', 'FMA46634', 'FMA7647'].includes(
      s.fmaId,
    ),
  ),
);
let stress = initialDissection;
for (let i = 0; i < 80; i++)
  stress = dissectionReducer(stress, { type: 'stage', id: i % 2 ? 'assembled' : 'bones' });
assert.equal(stress.history.length, 40);
const manifest = {
  version: 1,
  reviewStatus: 'draft-unvalidated',
  displayCatalogSha256: createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),
  catalogSha256: createHash('sha256')
    .update(
      await fs.readFile('public/models/bodyparts3d/full-body/catalog.json'),
    )
    .digest('hex'),
  profiles: Object.entries(dissectionProfiles).map(([region, profile]) => {
    const scope = catalog.structures.filter(
      (s) => region === 'whole-body' || s.regions.includes(region),
    );
    return {
      region,
      ...profile,
      stages: profile.stages.map((stage) => ({
        ...stage,
        visibleStructureIds: stageStructures(scope, profile, stage.id).map(
          (s) => s.id,
        ),
      })),
      focuses: profile.focuses.map((f) => ({
        ...f,
        visibleStructureIds: stageStructures(scope, profile, 'free', f.id).map(
          (s) => s.id,
        ),
      })),
    };
  }),
};
await fs.writeFile(
  'content/dissection-manifest.json',
  JSON.stringify(manifest, null, 2),
);
const result = {
  passed: true,
  regions: catalog.regions.length,
  wholeBody: true,
  stages: rows.length,
  focusedViews: Object.values(dissectionProfiles).reduce(
    (n, p) => n + p.focuses.length,
    0,
  ),
  checks,
  cameraChecks,
  structures: catalog.structures.length,
  clinicalValidation: false,
  browserInteractionTesting: false,
  rows,
};
await fs.writeFile(
  'docs/dissection-validation.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify({ ...result, rows: undefined }, null, 2));
