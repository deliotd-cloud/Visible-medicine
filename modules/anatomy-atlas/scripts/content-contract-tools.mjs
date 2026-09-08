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
export * from './lib/content-types.ts';
export * from './app/body-content.ts';
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
