import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cache } from './bodyparts-archive.mjs';
import { sourceObjShape, mergeSourceShapes } from './source-surface-audit.mjs';
import { sourceTopology, fullSourceContact } from './source-topology.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
export async function supportingTopologyReport() {
  const priorBytes = await fs.readFile(
    'content/supporting-geometry-audit.json',
  );
  const prior = JSON.parse(priorBytes);
  const catalogBytes = await fs.readFile(
    'public/models/bodyparts3d/full-body/catalog.json',
  );
  const catalog = JSON.parse(catalogBytes);
  assert.equal(
    hash(catalogBytes),
    prior.catalogSha256,
    'An explicit admission requires a revised audit baseline',
  );
  const pairs = prior.comparisons.filter(
    (pair) =>
      pair.flagged ||
      (pair.a === 'FMA65198' && pair.b === 'FMA37389') ||
      (pair.a === 'FMA65199' && pair.b === 'FMA37388'),
  );
  assert.equal(pairs.length, 8);
  const ids = [
    ...new Set([
      ...prior.results.map((row) => row.fmaId),
      ...pairs.flatMap((pair) => [pair.a, pair.b]),
    ]),
  ];
  const shapes = new Map(),
    sources = [];
  for (const id of ids) {
    const candidate = prior.results.find((row) => row.fmaId === id);
    const existing = catalog.structures.find((row) => row.fmaId === id);
    const files = candidate
      ? [{ file: candidate.file, sha256: candidate.sha256 }]
      : existing.sources;
    const tree = candidate ? 'isa' : existing.sourceTree;
    const parts = [];
    for (const file of files) {
      assert.match(file.file, /^FJ\d+M?$/);
      assert.ok(['isa', 'partof'].includes(tree));
      const bytes = await fs.readFile(`${cache}/${tree}/${file.file}.obj`);
      assert.equal(
        hash(bytes),
        file.sha256,
        'Raw source must match the pinned evidence',
      );
      parts.push(sourceObjShape(bytes));
    }
    const shape = mergeSourceShapes(parts);
    shapes.set(id, shape);
    sources.push({
      id,
      name: candidate?.name ?? existing.sourceName,
      role: candidate?.role ?? 'existing-context',
      sourceTree: tree,
      files,
      topology: sourceTopology(shape),
    });
  }
  return {
    schemaVersion: 1,
    sourceVersion: prior.sourceVersion,
    license: prior.license,
    credit: prior.credit,
    licenseUrl: prior.licenseUrl,
    sourceUrl: prior.sourceUrl,
    priorAuditSha256: hash(priorBytes),
    catalogSha256: hash(catalogBytes),
    algorithmSha256: hash(
      (
        await fs.readFile(
          new URL('./source-topology.mjs', import.meta.url),
          'utf8',
        )
      ).replaceAll('\r\n', '\n'),
    ),
    sources,
    contacts: pairs.map(({ a, b }) => ({
      a,
      b,
      aToB: fullSourceContact(shapes.get(a), shapes.get(b)),
      bToA: fullSourceContact(shapes.get(b), shapes.get(a)),
    })),
    admitted: [],
    sourceGeometryChanged: false,
    clinicalValidation: false,
    limitations:
      'Exact-coordinate connectivity and every stored unique vertex/triangle centroid are checked. No tolerant welding, repairs, contact-area integration, volumetric intersection, attachment inference or surgical validation. Good connectivity alone is not anatomical admission.',
  };
}
