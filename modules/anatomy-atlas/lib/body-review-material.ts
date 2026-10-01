import rawCatalog from '../public/models/bodyparts3d/full-body/catalog.json';
import { bodyDisplayCatalog } from './body-display-catalog';
import { bodyLesson } from '../app/body-content';
import { contentTabs } from './content-types';
import type { BodyCatalog } from '../app/body-types';
import { makeStudyLink } from './study-links';
import { structureSearchAliases } from './anatomy-search';
import { bodyReasoningReview } from './body-reasoning-review';
import { regionalTourEvidence } from './regional-tours';

// Read-only review material, separate from private signed shoulder decisions.
const catalog = bodyDisplayCatalog(rawCatalog as unknown as BodyCatalog);
const searchStructures = new Map(catalog.structures.map(s => [s.id, s]));
/** Search-only vocabulary; source names, material and review identities stay exact. */
export function bodyReviewSearchAliases(id: string): string[] {
  const structure = searchStructures.get(id);
  return structure ? structureSearchAliases(structure) : [];
}
// Older clients must reject the expanded worksheet instead of hiding new review material.
export const bodyReviewSchema = 'vm-body-review-worksheet-3';
export const bodyReviewChecks = {
  geometry: [
    'Verify source identity, laterality, grouped parts and anatomical boundaries.',
    'Inspect shape, relationships, missing tissues and source-specific defects.',
    'Check labels, selection, isolation, separation and exact reassembly on real devices.',
  ],
  teaching: [
    'Verify each draft, its references, scope, attachments/actions and clinical wording.',
    'Record corrections and missing topics; pending or identification-only text is not completed teaching.',
    'Check Quiz notes and the displayed source-specific interactive reasoning question, including its answer, alternatives, explanation and references. Other questions are excluded.',
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
/** Current-build display evidence, resolved by exact ID, never by packet claims. */
export function bodyReviewSnapshot(id: string) {
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
  const reasoning = bodyReasoningReview(catalog, id);
  const guidedTours = regionalTourEvidence(catalog, id);
  const checks = {geometry:[...bodyReviewChecks.geometry],teaching:[...bodyReviewChecks.teaching] as string[],imaging:[...bodyReviewChecks.imaging]};
  if (guidedTours.length) checks.teaching.push('Review the entire displayed guided tour, all context surfaces, captions, references, target selections and camera transitions; record framing or teaching corrections.');
  return structuredClone({
    source,
    topics,
    reasoning,
    guidedTours,
    checklist: checks,
    atlasLink: makeStudyLink(catalog, structure.region, structure.id, 'both'),
    limits: [
      'Worksheet only: no review decision is saved or imported. It cannot approve anatomy, teaching or imaging.',
      'Hashes identify source/content/checklist snapshots, not signatures or a revision-bound approval of renderer code.',
      'This root-body selection excludes nested organ dissections, independent specimens and dedicated shoulder-pilot reviews.',
      'Draft readiness is editorial coverage, not clinical validation. Quiz notes and source-specific interactive reasoning are separate sections; only the displayed material is included, not the entire question bank.',
      'No patient images, spatial registration, private review history or paid lecture content is included.',
    ],
  });
}
export async function bodyReviewMaterial(id: string) {
  const snapshot = bodyReviewSnapshot(id);
  if (!snapshot) return null;
  const { source, topics, reasoning, guidedTours, checklist: checks } = snapshot;
  const scope = {
    schema: bodyReviewSchema,
    kind: 'body-display-catalog',
    structureId: id,
  };
  const fingerprints = {
    // The transport schema changed, not the anatomical source identity. Retain
    // its original hash domain so existing geometry decisions are not widened or invalidated.
    source: await digest({ scope: { ...scope, schema: 'vm-body-review-worksheet-1' }, source }),
    // Preserve unchanged teaching history outside this tour; the transport
    // version alone must not broaden/invalidate the reviewed teaching scope.
    teaching: await digest({ scope: {...scope,schema:'vm-body-review-worksheet-2'}, topics, reasoning, ...(guidedTours.length ? {guidedTours} : {}) }),
    checklist: await digest({ scope: {...scope,schema:'vm-body-review-worksheet-2'}, checks }),
  };
  return structuredClone({
    ...scope,
    status: 'worksheet-not-submitted' as const,
    approval: false as const,
    source,
    topics,
    reasoning,
    guidedTours,
    fingerprints,
    materialHash: await digest({ scope, fingerprints }),
    atlasLink: snapshot.atlasLink,
    checklist: checks,
    reviewerNotes: {
      reviewer: '',
      qualification: '',
      date: '',
      evidence: [],
      corrections: [],
    },
    limits: snapshot.limits,
  });
}
export type BodyReviewMaterial = NonNullable<
  Awaited<ReturnType<typeof bodyReviewMaterial>>
>;
