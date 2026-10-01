import type { BodyReviewMaterial } from './body-review-material';
import { bodyReviewDisplayMatches } from './body-review-display-integrity';
import { sourceCanonical } from './body-source-additions';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { validBodyPresentationParts } from './body-presentation-parts';
import {
  regionalTours,
  regionalTourLimitations,
  regionalTourStepFrames,
  regionalTourEvidence,
} from './regional-tours';
import rawCatalog from '../public/models/bodyparts3d/full-body/catalog.json';
import { bodyDisplayCatalog } from './body-display-catalog';

// Resolve once from this build's trusted catalogue, never from a response packet.
// Every visible context surface and bundle is material to clinical review.
// Unframed tours legitimately omit stepFrames; preserve absence while still
// comparing every supplied object field independently of JSON property order.
const wireCanonical = (value: unknown) => value === undefined
  ? undefined : sourceCanonical(JSON.parse(JSON.stringify(value)));
let trustedTourPackets: Map<string, string | undefined> | undefined;
function trustedTourPacket(id: string): string | undefined {
  if (!trustedTourPackets) {
    const catalog = bodyDisplayCatalog(rawCatalog as unknown as BodyCatalog);
    trustedTourPackets = new Map(
      regionalTours.map((t) => [
        t.id,
        wireCanonical(
          regionalTourEvidence(catalog, t.steps[0].selectedId).find(
            (e) => e.tour.id === t.id,
          ),
        ),
      ]),
    );
  }
  return trustedTourPackets.get(id);
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const hash = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const text = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;
const token = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const sides = ['left', 'right', 'midline', 'unpaired', 'unspecified'];
const sourceParts = (v: unknown): v is { file: string; sha256: string }[] =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every(
    (p) =>
      object(p) &&
      typeof p.file === 'string' &&
      /^FJ\d+M?$/.test(p.file) &&
      hash(p.sha256),
  ) &&
  new Set(v.map((p) => p.file)).size === v.length;
function safeReference(v: unknown): v is string {
  if (typeof v !== 'string' || !v.startsWith('https://') || /[\s\\]/.test(v))
    return false;
  try {
    const url = new URL(v);
    return (
      url.protocol === 'https:' &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
function validReasoning(
  value: unknown,
  source: Record<string, unknown>,
): boolean {
  if (value === null) return true;
  if (
    !object(value) ||
    !token(value.key) ||
    value.readiness !== 'draft' ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 1 ||
    !text(value.prompt) ||
    !text(value.explanation) ||
    !text(value.scope) ||
    !Array.isArray(value.references) ||
    !value.references.length ||
    !value.references.every(
      (r) => object(r) && text(r.title) && safeReference(r.url),
    ) ||
    !Array.isArray(value.choices) ||
    value.choices.length < 2 ||
    !object(source.structure) ||
    !object(source.bundle) ||
    value.answerId !== source.structure.id
  )
    return false;
  const s = source.structure,
    bundle = source.bundle;
  const choices = value.choices;
  if (
    !choices.every(
      (c) =>
        object(c) &&
        text(c.name) &&
        typeof c.id === 'string' &&
        /^vm:anatomy:(?:body|upper-limb):[a-z0-9-]+:(?:left|right|midline|unpaired|unspecified):[a-z0-9-]+:[a-z0-9-]+$/.test(
          c.id,
        ) &&
        typeof c.fmaId === 'string' &&
        /^FMA\d+$/.test(c.fmaId) &&
        typeof c.laterality === 'string' &&
        sides.includes(c.laterality) &&
        c.laterality === s.laterality &&
        c.id.split(':')[4] === c.laterality &&
        token(c.bundle) &&
        hash(c.bundleSha256) &&
        text(c.nodeName) &&
        ['isa', 'partof'].includes(String(c.sourceTree)) &&
        strings(c.regions) &&
        c.regions.length > 0 &&
        c.regions.every(token) &&
        new Set(c.regions).size === c.regions.length &&
        sourceParts(c.sources),
    ) ||
    new Set(choices.map((c) => c.id)).size !== choices.length
  )
    return false;
  const answer = choices.find((c) => c.id === value.answerId);
  if (
    !answer ||
    ![
      'id',
      'name',
      'fmaId',
      'laterality',
      'bundle',
      'nodeName',
      'sourceTree',
    ].every((k) => answer[k] === s[k]) ||
    answer.bundle !== bundle.id ||
    answer.bundleSha256 !== bundle.sha256 ||
    !strings(s.regions) ||
    JSON.stringify(answer.regions) !== JSON.stringify(s.regions) ||
    !sourceParts(s.sources)
  )
    return false;
  const sources = s.sources;
  if (
    answer.sources.length !== sources.length ||
    !answer.sources.every(
      (p: { file: string; sha256: string }, i: number) =>
        p.file === sources[i].file && p.sha256 === sources[i].sha256,
    )
  )
    return false;
  return true;
}
function validTours(value: unknown, source: Record<string, unknown>): boolean {
  if (
    !Array.isArray(value) ||
    value.length > 4 ||
    !object(source.structure) ||
    !object(source.bundle)
  )
    return false;
  const selected = source.structure,
    bundle = source.bundle;
  const expected = regionalTours.filter((t) =>
    [...t.contextIds, ...t.steps.map((s) => s.selectedId)].includes(
      String(selected.id),
    ),
  );
  if (
    value.length !== expected.length ||
    new Set(value.map((e) => (object(e) && object(e.tour) ? e.tour.id : null)))
      .size !== value.length
  )
    return false;
  return value.every((e) => {
    if (
      !object(e) ||
      !object(e.tour) ||
      !Array.isArray(e.structures) ||
      !Array.isArray(e.bundles) ||
      e.transitionMs !== 1800 ||
      e.transition !== 'quintic-orbit' ||
      e.separation !== 0 ||
      !text(e.limitations) ||
      !text(e.sourceVersion)
    )
      return false;
    const t = e.tour,
      structures = e.structures,
      bundles = e.bundles;
    const definition = expected.find((item) => item.id === t.id);
    if (!definition || wireCanonical(t) !== wireCanonical(definition))
      return false;
    if (wireCanonical(e) !== trustedTourPacket(definition.id)) return false;
    if (e.limitations !== regionalTourLimitations(definition)) return false;
    if (
      !token(t.id) ||
      !token(t.revision) ||
      !token(t.region) ||
      !text(t.title) ||
      !text(t.description) ||
      t.status !== 'draft' ||
      !strings(t.contextIds) ||
      !Array.isArray(t.steps) ||
      !t.steps.length ||
      t.steps.length > 30
    )
      return false;
    if (
      !structures.every(
        (s) =>
          object(s) &&
          text(s.id) &&
          text(s.name) &&
          token(s.bundle) &&
          sourceParts(s.sources) &&
          typeof s.laterality === 'string' &&
          sides.includes(s.laterality) &&
          s.id.split(':')[4] === s.laterality,
      ) ||
      new Set(structures.map((s) => s.id)).size !== structures.length ||
      !bundles.every((b) => object(b) && token(b.id) && hash(b.sha256)) ||
      new Set(bundles.map((b) => b.id)).size !== bundles.length
    )
      return false;
    if (
      !t.steps.every(
        (s) =>
          object(s) &&
          token(s.id) &&
          text(s.title) &&
          text(s.caption) &&
          structures.some((v) => v.id === s.selectedId) &&
          [
            'anterior',
            'posterior',
            'left',
            'right',
            'superior',
            'inferior',
          ].includes(String(s.view)) &&
          typeof s.fadeOthers === 'boolean' &&
          Number.isSafeInteger(s.durationMs) &&
          (s.durationMs as number) >= 1000 &&
          (s.durationMs as number) <= 120000 &&
          Array.isArray(s.references) &&
          s.references.length > 0 &&
          s.references.every(safeReference),
      ) ||
      new Set(t.steps.map((s) => s.id)).size !== t.steps.length ||
      !t.contextIds.every((id) => structures.some((s) => s.id === id))
    )
      return false;
    const own = structures.find((s) => s.id === selected.id),
      contextIds = t.contextIds,
      steps = t.steps;
    try {
      const frames = regionalTourStepFrames(
        { structures, bundles } as unknown as BodyCatalog,
        definition,
      );
      if (wireCanonical(e.stepFrames) !== wireCanonical(frames)) return false;
    } catch {
      return false;
    }
    return (
      !!own &&
      wireCanonical(own) === wireCanonical(selected) &&
      bundles.some((b) => b.id === bundle.id && b.sha256 === bundle.sha256) &&
      structures.every((s) => bundles.some((b) => b.id === s.bundle)) &&
      structures.every(
        (s) =>
          contextIds.includes(s.id) ||
          steps.some((step) => object(step) && step.selectedId === s.id),
      )
    );
  });
}
/** Validate current-build display evidence; never accept a review decision.
 * Save-time revision hashes are independently recomputed by the server.
 */
export async function parseBodyReviewResponse(
  value: unknown,
  expectedId: string,
): Promise<BodyReviewMaterial | null> {
  try {
    if (
      !object(value) ||
      value.schema !== 'vm-body-review-worksheet-3' ||
      value.kind !== 'body-display-catalog' ||
      value.structureId !== expectedId ||
      value.approval !== false ||
      value.status !== 'worksheet-not-submitted' ||
      !hash(value.materialHash)
    )
      return null;
    const source = value.source;
    if (
      !object(source) ||
      !object(source.structure) ||
      !object(source.bundle) ||
      !hash(source.bundle.sha256) ||
      !['credit', 'licence', 'sourceVersion'].every(
        (k) => typeof source[k] === 'string',
      )
    )
      return null;
    const s = source.structure;
    if (
      s.id !== expectedId ||
      !['name', 'fmaId', 'laterality', 'sourceTree'].every(
        (k) => typeof s[k] === 'string',
      ) ||
      !(s.coverageNote == null || typeof s.coverageNote === 'string') ||
      !Array.isArray(s.sources) ||
      !s.sources.length ||
      !s.sources.every(
        (p) => object(p) && typeof p.file === 'string' && hash(p.sha256),
      ) ||
      new Set(s.sources.map((p) => p.file)).size !== s.sources.length
    )
      return null;
    if (
      !(
        value.atlasLink === null ||
        (typeof value.atlasLink === 'string' &&
          /^\/(?:regions\/[a-z-]+)?\?/.test(value.atlasLink))
      )
    )
      return null;
    if (s.presentationParts !== undefined) {
      if (!Array.isArray(s.presentationParts)) return null;
      try {
        if (!validBodyPresentationParts(s as unknown as BodyStructure))
          return null;
      } catch {
        return null;
      }
    }
    const tabs = [
      'anatomy',
      'function',
      'ct',
      'mri',
      'xray',
      'ultrasound',
      'pathology',
      'clinical',
      'quiz',
    ];
    if (
      !Array.isArray(value.topics) ||
      value.topics.length !== tabs.length ||
      !value.topics.every(
        (t, i) =>
          object(t) &&
          t.tab === tabs[i] &&
          typeof t.title === 'string' &&
          typeof t.body === 'string' &&
          [
            'draft',
            'pending',
            'identity-only',
            'generated-identification',
          ].includes(String(t.readiness)) &&
          (t.bullets === undefined || strings(t.bullets)) &&
          (t.citations === undefined || strings(t.citations)) &&
          (t.correctAnswer === undefined ||
            typeof t.correctAnswer === 'string') &&
          (t.explanation === undefined || typeof t.explanation === 'string') &&
          (t.note === undefined || typeof t.note === 'string'),
      )
    )
      return null;
    if (!validReasoning(value.reasoning, source)) return null;
    if (!validTours(value.guidedTours, source)) return null;
    const checks = value.checklist;
    if (
      !object(checks) ||
      !['geometry', 'teaching', 'imaging'].every((k) => strings(checks[k])) ||
      !strings(value.limits)
    )
      return null;
    // Exact current-build evidence, including references/answers/limitations, is
    // pinned without importing the full teaching corpus into this private UI.
    if (!(await bodyReviewDisplayMatches(value, expectedId))) return null;
    return value as BodyReviewMaterial;
  } catch {
    return null;
  }
}
