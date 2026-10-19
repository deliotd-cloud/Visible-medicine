import { bodySystems, type BodyCatalog, type BodyStructure } from '../app/body-types';
import { finitePoint, referenceTransform, type SourceCoordinates } from './anatomy-coordinates';
import { validBodyPresentationParts } from './body-presentation-parts';
import { modelDeliveryUrl } from './model-delivery';

function check(condition: unknown): asserts condition {
  if (!condition) throw new Error('Invalid anatomy catalog');
}
function record(value: unknown): Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function nonemptyArray(value: unknown): unknown[] {
  check(Array.isArray(value) && value.length > 0);
  return value;
}
function unique(value: unknown, seen: Set<string>): asserts value is string {
  check(text(value) && !seen.has(value));
  seen.add(value);
}
function source(value: unknown): Record<string, unknown> {
  const item = record(value);
  check(text(item.file) && typeof item.sha256 === 'string' && /^[a-f0-9]{64}$/.test(item.sha256));
  return item;
}
function spatial(value: Record<string, unknown>) {
  const bounds = record(value.bounds);
  check(finitePoint(bounds.min) && finitePoint(bounds.max));
  check(bounds.min.every((n, i) => n <= (bounds.max as number[])[i]));
  check(bounds.min.some((n, i) => n < (bounds.max as number[])[i]));
  check(finitePoint(value.center) && finitePoint(value.anchor));
}

/** Validate JSON before any catalogue transformation or React state commit.
 * This is structural validation, NOT source admission, licence or clinical approval.
 * Keep every byte of metadata and every record; never repair/filter a partial load. */
export function parseBodyCatalog(value: unknown): BodyCatalog {
  const catalog = record(value);
  check(Number.isSafeInteger(catalog.version) && (catalog.version as number) > 0);
  check(catalog.sourceVersion === '4.0' && text(catalog.license) && text(catalog.credit));
  const coordinates = record(catalog.coordinateSystem);
  referenceTransform(coordinates as unknown as SourceCoordinates);
  const coverage = record(catalog.coverage);
  check(text(coverage.nerves) && text(coverage.organs));
  for (const key of ['vessels', 'connective'])
    check(coverage[key] === undefined || text(coverage[key]));
  check(Array.isArray(catalog.excluded));
  for (const entry of catalog.excluded) {
    const item = record(entry);
    check(text(item.fmaId) && text(item.name) && text(item.reason));
  }
  const regions = new Set<string>(), bundles = new Set<string>();
  for (const entry of nonemptyArray(catalog.regions)) {
    const region = record(entry);
    unique(region.id, regions);
    check(text(region.name) && typeof region.description === 'string');
  }
  for (const entry of nonemptyArray(catalog.bundles)) {
    const bundle = record(entry);
    unique(bundle.id, bundles);
    check(typeof bundle.url === 'string' && bundle.url.split('?')[0].endsWith('.glb'));
    // Reuse contained-delivery path rules even when checking standalone input.
    modelDeliveryUrl(bundle.url, '/atlas-runtime/head-neck');
    check(Number.isSafeInteger(bundle.bytes) && (bundle.bytes as number) > 0);
    check(Number.isSafeInteger(bundle.structures) && (bundle.structures as number) > 0);
    check(typeof bundle.sha256 === 'string' && /^[a-f0-9]{64}$/.test(bundle.sha256));
  }
  const ids = new Set<string>(), fmas = new Set<string>();
  const nodes = new Set<string>();
  for (const entry of nonemptyArray(catalog.structures)) {
    const item = record(entry);
    unique(item.id, ids);
    unique(item.fmaId, fmas);
    check(/^FMA\d+$/.test(item.fmaId));
    for (const field of ['name', 'sourceName', 'category', 'nodeName']) check(text(item[field]));
    check(typeof item.system === 'string' && Object.hasOwn(bodySystems, item.system));
    check(typeof item.laterality === 'string' && ['left', 'right', 'midline', 'unpaired', 'unspecified'].includes(item.laterality));
    check(typeof item.region === 'string' && regions.has(item.region));
    const memberRegions = new Set<string>();
    for (const region of nonemptyArray(item.regions)) {
      unique(region, memberRegions);
      check(regions.has(region));
    }
    check(memberRegions.has(item.region));
    check(typeof item.bundle === 'string' && bundles.has(item.bundle));
    unique(JSON.stringify([item.bundle, item.nodeName]), nodes);
    check(item.sourceTree === 'isa' || item.sourceTree === 'partof');
    const files = new Set<string>();
    for (const entry of nonemptyArray(item.sources)) unique(source(entry).file, files);
    check(item.coverageNote === null || typeof item.coverageNote === 'string');
    spatial(item);
    if (item.provenance !== undefined) {
      const provenance = record(item.provenance);
      check(provenance.method === 'licensed-source-mesh' && text(provenance.license)
        && text(provenance.sourceVersion) && typeof provenance.recovered === 'boolean');
    }
    if (item.validation !== undefined) {
      const validation = record(item.validation);
      check(validation.status === 'unvalidated' && validation.anatomicalReview === false);
    }
    if (item.representation !== undefined) {
      const representation = record(item.representation);
      check(representation.coverage === 'partial' && representation.sourceLaterality === 'unspecified'
        && representation.displayLaterality === 'right' && text(representation.description));
    }
    if (item.presentationParts !== undefined) {
      for (const part of nonemptyArray(item.presentationParts)) {
        const presentation = record(part);
        source(presentation.source);
        check(text(presentation.nodeName));
        spatial(presentation);
      }
      check(validBodyPresentationParts(item as unknown as BodyStructure));
    }
  }
  return value as BodyCatalog;
}
