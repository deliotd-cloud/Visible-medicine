import rawCatalog from '../public/models/bodyparts3d/full-body/catalog.json';
import { bodyDisplayCatalog } from './body-display-catalog';
import { bodyLesson } from '../app/body-content';
import { contentTabs } from './content-types';
import type { BodyCatalog } from '../app/body-types';
import { makeStudyLink } from './study-links';
import { structureSearchAliases } from './anatomy-search';

// Read-only review material, separate from private signed shoulder decisions.
const catalog = bodyDisplayCatalog(rawCatalog as unknown as BodyCatalog);
const searchStructures = new Map(catalog.structures.map(s => [s.id, s]));
/** Search-only vocabulary; source names, material and review identities stay exact. */
export function bodyReviewSearchAliases(id: string): string[] {
  const structure = searchStructures.get(id);
  return structure ? structureSearchAliases(structure) : [];
}
export const bodyReviewSchema = 'vm-body-review-worksheet-1';
export const bodyReviewChecks = {
  geometry: [
    'Verify source identity, laterality, grouped parts and anatomical boundaries.',
    'Inspect shape, relationships, missing tissues and source-specific defects.',
    'Check labels, selection, isolation, separation and exact reassembly on real devices.',
  ],
  teaching: [
    'Verify each draft, its references, scope, attachments/actions and clinical wording.',
    'Record corrections and missing topics; pending or identification-only text is not completed teaching.',
    'Check assessment answers separately; this worksheet does not contain the interactive question bank.',
  ],
  imaging: [
    'Review CT, MRI, X-ray and ultrasound wording separately from acquired-image registration.',
    'Require licensed images, exact patient/reference frames and validated mappings before linking scans.',
    'Preserve independent atlas/lecture entitlements; reading links confer no paid-resource access.',
  ],
} as const;
export const bodyReviewRegions = catalog.regions;
export const bodyReviewSummaries = catalog.structures.map((s) => ({
  id: s.id,
  name: s.name,
  fmaId: s.fmaId,
  system: s.system,
  laterality: s.laterality,
  regions: s.regions,
}));

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`;
  return JSON.stringify(value);
}
async function digest(value: unknown) {
  const clean = JSON.parse(JSON.stringify(value));
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical(clean)),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
export async function bodyReviewMaterial(id: string) {
  if (!id || id.length > 256) return null;
  const matches = catalog.structures.filter((s) => s.id === id);
  if (matches.length !== 1) return null;
  const structure = matches[0];
  const bundles = catalog.bundles.filter((b) => b.id === structure.bundle);
  if (
    bundles.length !== 1 ||
    new Set(structure.sources.map((s) => s.file)).size !==
      structure.sources.length
  )
    throw new Error('Ambiguous review source');
  const source = {
    structure,
    bundle: bundles[0],
    coordinateSystem: catalog.coordinateSystem,
    sourceVersion: catalog.sourceVersion,
    licence: catalog.license,
    credit: catalog.credit,
  };
  const topics = contentTabs.map((tab) => ({
    tab,
    ...bodyLesson(structure, tab),
  }));
  const scope = {
    schema: bodyReviewSchema,
    kind: 'body-display-catalog',
    structureId: id,
  };
  const fingerprints = {
    source: await digest({ scope, source }),
    teaching: await digest({ scope, topics }),
    checklist: await digest({ scope, checks: bodyReviewChecks }),
  };
  return structuredClone({
    ...scope,
    status: 'worksheet-not-submitted' as const,
    approval: false as const,
    source,
    topics,
    fingerprints,
    materialHash: await digest({ scope, fingerprints }),
    atlasLink: makeStudyLink(catalog, structure.region, structure.id, 'both'),
    checklist: bodyReviewChecks,
    reviewerNotes: {
      reviewer: '',
      qualification: '',
      date: '',
      evidence: [],
      corrections: [],
    },
    limits: [
      'Worksheet only: no review decision is saved or imported. It cannot approve anatomy, teaching or imaging.',
      'Hashes identify source/content/checklist snapshots, not signatures or a revision-bound approval of renderer code.',
      'This root-body selection excludes nested organ dissections, independent specimens and dedicated shoulder-pilot reviews.',
      'Draft readiness is editorial coverage, not clinical validation. Quiz notes do not represent the interactive question bank.',
      'No patient images, spatial registration, private review history or paid lecture content is included.',
    ],
  });
}
export type BodyReviewMaterial = NonNullable<
  Awaited<ReturnType<typeof bodyReviewMaterial>>
>;
