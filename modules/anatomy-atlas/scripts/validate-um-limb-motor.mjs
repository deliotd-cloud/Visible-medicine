import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const built = await build({ stdin: { contents: "export * from './lib/um-limb-motor.ts'; export * from './lib/independent-specimen.ts'; export { limbDefinitions } from './lib/um-limb-studies.ts'; export { specimenLessons } from './content/um-limb-teaching.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { specimenMotorGroups, motorStudyAction, initialSpecimen, reduceSpecimen, limbDefinitions, specimenLessons } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const whole = limbDefinitions.whole, copy = x => JSON.parse(JSON.stringify(x));
const groups = specimenMotorGroups(whole), targetSlugs = key => groups.find(g => g.key === key).targets.map(t => t.surface.slug).sort();
assert.equal(groups.length, 15);
assert.equal(groups.reduce((n, g) => n + g.targets.length, 0), 43);
assert.equal(new Set(groups.flatMap(g => g.targets.map(t => t.surface.id))).size, 42);
assert.deepEqual(targetSlugs('sciatic-fibular'), ['biceps-femoris-short-head']);
assert.deepEqual(targetSlugs('sciatic-tibial'), ['adductor-magnus', 'biceps-femoris-long-head', 'semimembranosus', 'semitendinosus']);
assert.deepEqual(targetSlugs('lumbar-rami'), ['psoas-major']);
assert.equal(targetSlugs('femoral').includes('psoas-major'), false);
assert.deepEqual(targetSlugs('obturator-internus'), ['obturator-internus', 'superior-gemellus']);
assert.equal(targetSlugs('obturator').includes('obturator-internus'), false);
assert.deepEqual(specimenLessons['adductor-magnus'].motorGroups.map(s => s.part), ['Adductor part', 'Hamstring part']);
assert.match(specimenLessons.pectineus.motorGroups[0].caveat, /variable/);
assert.match(specimenLessons['superior-gemellus'].motorGroups[0].caveat, /Additional supply/);
const before = JSON.stringify(limbDefinitions);
let regionalGroups = 0;
for (const definition of Object.values(limbDefinitions)) {
  const initial = initialSpecimen(definition);
  assert.equal(motorStudyAction(definition, 'sciatic'), null); // No invented aggregate/descendant expansion.
  assert.equal(motorStudyAction(definition, '__proto__'), null);
  for (const group of specimenMotorGroups(definition)) {
    regionalGroups++;
    const action = motorStudyAction(definition, group.key);
    const shown = reduceSpecimen(definition, initial, action);
    assert.equal(shown.history.length, 1);
    assert.equal(shown.future.length, 0);
    const targetIds = group.targets.map(t => t.surface.id);
    assert.equal(shown.selectedId, targetIds[0]);
    const expected = definition.surfaces.filter(s => targetIds.includes(s.id) || s.tissue === 'skeleton').map(s => s.id);
    assert.deepEqual(definition.surfaces.filter(s => !shown.hidden.includes(s.id)).map(s => s.id), expected);
    assert.deepEqual(reduceSpecimen(definition, reduceSpecimen(definition, shown, { type: 'undo' }), { type: 'redo' }), shown);
    const restored = reduceSpecimen(definition, shown, { type: 'undo' });
    assert.deepEqual(restored.hidden, initial.hidden); assert.equal(restored.selectedId, initial.selectedId);
    for (const target of group.targets) {
      assert.equal(target.surface.tissue, 'muscle');
      assert.ok(specimenLessons[target.surface.slug].attachments);
      assert.ok(specimenLessons[target.surface.slug].references.length);
      assert.ok(definition.surfaces.some(s => s.id === target.surface.id));
    }
  }
  for (const action of [
    { type: 'show-only', ids: [], selectedId: 'foreign' },
    { type: 'show-only', ids: [definition.surfaces[0].id, definition.surfaces[0].id], selectedId: definition.surfaces[0].id },
    { type: 'show-only', ids: [definition.surfaces[0].id, 'foreign'], selectedId: definition.surfaces[0].id },
    { type: 'show-only', ids: [definition.surfaces[0].id], selectedId: 'foreign' },
  ]) assert.equal(reduceSpecimen(definition, initial, action), initial);
}
const changed = copy(whole), selected = changed.surfaces.find(s => s.slug === 'soleus');
selected.sources[0].sha256 = 'changed';
assert.ok(!specimenMotorGroups(changed).flatMap(g => g.targets).some(t => t.surface.id === selected.id));
const renamed = copy(whole); renamed.surfaces.find(s => s.slug === 'soleus').name = 'Another muscle';
assert.ok(!specimenMotorGroups(renamed).flatMap(g => g.targets).some(t => t.surface.slug === 'soleus'));
const badBundle = copy(whole); badBundle.catalog.bundles.forEach(b => { b.sha256 = 'changed'; });
assert.deepEqual(specimenMotorGroups(badBundle), []);
assert.equal(motorStudyAction(badBundle, 'femoral'), null);
assert.equal(JSON.stringify(limbDefinitions), before);
const component = await componentBuild({ entryPoints: ['app/um-limb-motor.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node' });
const require = createRequire(import.meta.url), React = require('react'), mod = { exports: {} };
runInNewContext(component.outputFiles[0].text, { module: mod, exports: mod.exports, require, URL, console, process: { env: { NODE_ENV: 'test' } } });
for (const definition of Object.values(limbDefinitions)) {
  const html = require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.SpecimenMotorExplorer, { definition, selectedId: null, onSelect() {}, onExplore() {} }));
  assert.match(html, /Muscles by nerve/); assert.match(html, /Nerves themselves are not modelled/);
  assert.match(html, /aria-label="Motor nerve group"/); assert.doesNotMatch(html, /<details[^>]*\bopen=/);
}
const parent = await readFile('app/um-knee-study.tsx', 'utf8');
assert.match(parent, /motorStudyAction\(specimen, nerve\)/);
assert.match(parent, /dispatch\(action\); assembledDisplay\(\); setQuery\(''\); setJointCloseUp\(false\); setView\(group.view\)/);
console.log(JSON.stringify({ groups: 15, pinnedMuscleSelections: 42, relationships: 43, regionalGroups, atomicHistoryAndBindingGuards: 'passed', collapsedMarkupScopes: 5, newNerveMeshes: 0, browserOrClinicalAcceptance: false }));
