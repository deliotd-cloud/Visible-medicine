import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { build } from './workspace-test-build.mjs';

export const contentRoot = new URL('../', import.meta.url);
export const readContentJson = async (path) =>
  JSON.parse(await readFile(new URL(path, contentRoot), 'utf8'));
export async function contentContext() {
  const compiled = await build({
    stdin: {
      contents: `export * from './lib/content-export.ts';
export { bodyDisplayCatalog } from './lib/body-display-catalog.ts';
export * from './lib/content-types.ts';
export * from './lib/pelvic-veins.ts';
export * from './content/pelvic-vein-teaching.ts';
export * from './app/body-content.ts';
export * from './lib/foot-sesamoid-teaching.ts';
export * from './lib/laryngeal-framework-imaging.ts';
export * from './lib/lateral-cricoarytenoid-us.ts';
export * from './lib/plantar-arterial-us.ts';
export * from './lib/common-interosseous-us.ts';
export * from './lib/coronary-arterial-us.ts';
export * from './lib/elbow-arterial-ct.ts';
export * from './lib/orbital-nerve-mri.ts';
export * from './lib/circle-willis-imaging.ts';
export * from './lib/thoracic-quiz.ts';
export * from './lib/cervical-quiz.ts';
export * from './lib/abdominal-organ-quiz.ts';
export * from './lib/pelvic-organ-quiz.ts';
export * from './lib/brain-connections-quiz.ts';
export * from './lib/shoulder-arterial-ct.ts';
export * from './lib/body-review-material.ts';
export * from './lib/hilar-vessel-xray.ts';
export * from './lib/thoracic-inlet-xray.ts';
export * from './lib/spine-imaging.ts';
export * from './lib/hip-imaging.ts';
export * from './lib/hip-abductor-xray.ts';
export * from './lib/hand-bone-xray.ts';
export * from './lib/hallux-xray.ts';
export * from './content/hip-abductor-xray.ts';
export * from './lib/wrist-imaging.ts';
export * from './lib/tarsal-imaging.ts';
export * from './lib/upper-vessel-imaging.ts';
export * from './lib/lower-arterial-imaging.ts';
export * from './lib/plantar-arterial-ct.ts';
export * from './lib/transverse-mesocolon-mri.ts';
export * from './lib/small-intestinal-mesentery-mri.ts';
export * from './lib/limb-bone-imaging.ts';
export * from './content/limb-bone-imaging.ts';
export * from './lib/thoracic-bone-imaging.ts';
export * from './lib/abdominal-organ-imaging.ts';
export * from './lib/pelvic-organ-imaging.ts';
export * from './lib/thigh-muscle-imaging.ts';
export * from './lib/leg-muscle-imaging.ts';
export * from './lib/foot-muscle-imaging.ts';
export * from './lib/forearm-muscle-imaging.ts';
export * from './lib/hand-muscle-imaging.ts';
export * from './lib/central-neural-imaging.ts';
export * from './lib/head-neck-vessel-imaging.ts';
export * from './lib/chest-wall-muscle-imaging.ts';
export * from './lib/shoulder-arm-muscle-imaging.ts';
export * from './lib/spine-pelvic-muscle-imaging.ts';
export * from './content/spine-pelvic-muscle-imaging.ts';
export * from './lib/cranial-bone-imaging.ts';
export * from './content/cranial-bone-imaging.ts';
export * from './lib/acral-bone-imaging.ts';
export * from './content/acral-bone-imaging.ts';
export * from './lib/orbital-neck-muscle-imaging.ts';
export * from './content/orbital-neck-muscle-imaging.ts';
export * from './lib/thoracoabdominal-organ-imaging.ts';
export * from './content/thoracoabdominal-organ-imaging.ts';
export * from './content/main-bronchus-xray.ts';
export * from './lib/main-bronchus-xray.ts';
export * from './lib/proper-digital-teaching.ts';
export * from './content/proper-digital-teaching.ts';
export * from './lib/spinal-disc-function.ts';
export * from './lib/laryngeal-muscle-imaging.ts';
export * from './content/laryngeal-muscle-imaging.ts';
export * from './content/spinal-disc-function.ts';
export * from './lib/central-vessel-imaging.ts';
export * from './lib/mediastinal-xray.ts';
export * from './lib/lamina-pathology.ts';
export * from './lib/epigastric-vein-pathology.ts';
export * from './lib/short-ciliary-pathology.ts';
export * from './lib/anterior-cardiac-pathology.ts';
export * from './content/central-vessel-imaging.ts';
export * from './lib/thoracic-branch-imaging.ts';
export * from './content/thoracic-branch-imaging.ts';
export * from './lib/abdominal-branch-imaging.ts';
export * from './content/abdominal-branch-imaging.ts';
export * from './lib/craniofacial-organ-imaging.ts';
export * from './content/craniofacial-organ-imaging.ts';
export * from './lib/rectal-deferent-imaging.ts';
export * from './content/rectal-deferent-imaging.ts';
export * from './lib/deferent-clinical.ts';
export * from './content/deferent-clinical.ts';
export * from './content/shoulder-arm-muscle-imaging.ts';
export * from './lib/shoulder-arm-curriculum.ts';
export * from './lib/forearm-curriculum.ts';
export * from './lib/hand-curriculum.ts';
export * from './lib/thigh-curriculum.ts';
export * from './lib/leg-curriculum.ts';
export * from './lib/foot-curriculum.ts';
export * from './lib/pelvic-curriculum.ts';
export * from './lib/orbital-curriculum.ts';
export * from './lib/swallowing-curriculum.ts';
export * from './lib/neck-curriculum.ts';
export * from './lib/deep-neck-curriculum.ts';
export * from './lib/trunk-curriculum.ts';
export * from './lib/orbital-nerve-curriculum.ts';
export * from './lib/central-neuro-curriculum.ts';
export * from './lib/organ-curriculum.ts';
export * from './lib/connective-curriculum.ts';
export * from './lib/spinal-bone-curriculum.ts';
export * from './lib/thoracic-bone-curriculum.ts';
export * from './lib/cranial-bone-curriculum.ts';
export * from './lib/limb-bone-curriculum.ts';
export * from './lib/acral-bone-curriculum.ts';
export * from './lib/thoracic-vessel-curriculum.ts';
export * from './lib/abdominal-vessel-curriculum.ts';
export * from './lib/pelvic-vessel-curriculum.ts';
export * from './lib/upper-limb-vessel-curriculum.ts';
export * from './lib/regional-vessel-curriculum.ts';
export * from './lib/neural-anatomy-curriculum.ts';
export * from './lib/organ-anatomy-curriculum.ts';
export * from './lib/connective-anatomy-curriculum.ts';
export * from './lib/shoulder-clinical-curriculum.ts';
export * from './lib/scapular-arm-clinical-curriculum.ts';
export * from './lib/forearm-clinical-curriculum.ts';
export * from './lib/hand-clinical-curriculum.ts';
export * from './lib/thigh-clinical-curriculum.ts';
export * from './lib/leg-clinical-curriculum.ts';
export * from './lib/foot-clinical-curriculum.ts';
export * from './lib/trunk-clinical-curriculum.ts';
export * from './lib/head-clinical-curriculum.ts';
export * from './lib/neck-clinical-curriculum.ts';
export * from './lib/limb-bone-clinical-curriculum.ts';
export * from './lib/axial-bone-clinical-curriculum.ts';
export * from './lib/cranial-bone-clinical-curriculum.ts';
export * from './lib/acral-bone-clinical-curriculum.ts';
export * from './lib/orbital-neural-clinical-curriculum.ts';
export * from './lib/central-neural-clinical-curriculum.ts';
export * from './lib/thoracic-organ-clinical-curriculum.ts';
export * from './lib/abdominal-organ-clinical-curriculum.ts';
export * from './lib/pelvic-organ-clinical-curriculum.ts';
export * from './lib/head-organ-clinical-curriculum.ts';
export * from './lib/dental-clinical-curriculum.ts';
export * from './lib/limb-connective-clinical-curriculum.ts';
export * from './lib/axial-connective-clinical-curriculum.ts';
export * from './lib/regional-connective-clinical-curriculum.ts';
export * from './lib/thoracic-vessel-clinical-curriculum.ts';
export * from './lib/abdominal-vessel-clinical-curriculum.ts';
export * from './lib/pelvic-vessel-clinical-curriculum.ts';
export * from './lib/head-neck-vessel-clinical-curriculum.ts';
export * from './lib/shoulder-arm-vessel-clinical-curriculum.ts';
export * from './lib/forearm-vessel-clinical-curriculum.ts';
export * from './lib/hand-vessel-clinical-curriculum.ts';
export * from './lib/lower-limb-vessel-clinical-curriculum.ts';
export { structures } from './app/anatomy-data.ts';
export { dissectionProfiles } from './app/dissection-data.ts';`,
      resolveDir: fileURLToPath(contentRoot),
      loader: 'ts',
    },
    format: 'esm',
    platform: 'node',
    write: false,
    bundle: true,
  });
  const api = await import(
    'data:text/javascript;base64,' +
      Buffer.from(compiled.outputFiles[0].text).toString('base64')
  );
  const catalog = await readContentJson(
    'public/models/bodyparts3d/full-body/catalog.json',
  );
  const manifest = await readContentJson(
    'public/models/bodyparts3d/manifest.json',
  );
  const revisions = await readContentJson('content/review-revisions.json');
  const shoulder = api.shoulderContentRecords(
    api.structures,
    manifest,
    revisions.revisions,
  );
  const body = api.bodyContentRecords(catalog);
  const registry = new Map(
    [...shoulder, ...body].map((record) => [recordKey(record), record]),
  );
  assert.equal(
    registry.size,
    shoulder.length + body.length,
    'Duplicate scope/identity',
  );
  return { api, catalog, manifest, revisions, shoulder, body, registry };
}
export const recordKey = (record) =>
  `${record.representationScope}|${record.id}`;
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map((key) => [key, sorted(value[key])]),
    );
  return value;
}
const canonical = (value) => JSON.stringify(sorted(value));
const byJson = (a, b) =>
  canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0;
const normalizedBindings = (bindings) =>
  bindings
    .map((binding) => ({
      ...binding,
      sources: [...binding.sources].sort(byJson),
    }))
    .sort(byJson);

/** Validates content seeds against a separately loaded, trusted local registry.
 * This is not a review API, source admission, patient filter or DB write. */
export async function contentValidator(registry) {
  const schema = await readContentJson(
    'content/schema/anatomy-structure.schema.json',
  );
  const validateShape = new Ajv2020({ strict: true, allErrors: true }).compile(
    schema,
  );
  return (record) => {
    if (!record || record.schemaVersion !== 2)
      throw Error(
        'Legacy/unversioned content needs explicit source bindings and readiness migration; it is not imported automatically.',
      );
    if (!validateShape(record)) {
      const error = validateShape.errors[0];
      throw Error(
        `Invalid content record: ${error.instancePath || '/'} (${error.keyword})`,
      );
    }
    const quiz = record.content.quiz;
    if (Object.hasOwn(quiz, 'correctAnswer')) {
      if (quiz.bullets.filter(choice => choice === quiz.correctAnswer).length !== 1
        || new Set(quiz.bullets.map(choice => choice.trim())).size !== quiz.bullets.length)
        throw Error('Quiz answer must match exactly one unambiguous choice');
    }
    const expected = registry.get(recordKey(record));
    if (!expected)
      throw Error(
        'Unknown representation/identity; source admission is required first.',
      );
    for (const field of [
      'id',
      'name',
      'category',
      'system',
      'region',
      'laterality',
      'coordinateSystem',
      'provenance',
      'validation',
    ])
      if (canonical(record[field]) !== canonical(expected[field]))
        throw Error('Current source/revision mismatch: ' + field);
    if (
      canonical([...record.externalTerminology.fma].sort(byJson)) !==
      canonical([...expected.externalTerminology.fma].sort(byJson))
    )
      throw Error('Source terminology mismatch');
    if (
      canonical(normalizedBindings(record.meshBindings)) !==
      canonical(normalizedBindings(expected.meshBindings))
    )
      throw Error('Missing, duplicated or changed source mesh binding');
    // Existing shoulder teaching revisions identify exact authored material.
    // Editing it requires updating the authoring source and its fingerprints.
    if (
      expected.validation.materialRevisions.teaching &&
      canonical(record.content) !== canonical(expected.content)
    )
      throw Error('Teaching differs from its recorded current revision');
    return true;
  };
}
