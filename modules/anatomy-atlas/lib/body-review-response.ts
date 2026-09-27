import type { BodyReviewMaterial } from './body-review-material';
import type { BodyStructure } from '../app/body-types';
import { validBodyPresentationParts } from './body-presentation-parts';
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const hash = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const token = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const sides = ['left', 'right', 'midline', 'unpaired', 'unspecified'];
const sourceParts = (v: unknown): v is { file: string; sha256: string }[] =>
  Array.isArray(v) && v.length > 0 && v.every(p => object(p) &&
    typeof p.file === 'string' && /^FJ\d+M?$/.test(p.file) && hash(p.sha256)) &&
  new Set(v.map(p => p.file)).size === v.length;
function safeReference(v: unknown): v is string {
  if (typeof v !== 'string' || !/^https:\/\//.test(v) || /[\s\\]/.test(v)) return false;
  try {
    const url = new URL(v);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}
function validReasoning(value: unknown, source: Record<string, unknown>): boolean {
  if (value === null) return true;
  if (!object(value) || !token(value.key) || value.readiness !== 'draft' ||
    !Number.isSafeInteger(value.revision) || (value.revision as number) < 1 ||
    !text(value.prompt) || !text(value.explanation) || !text(value.scope) ||
    !Array.isArray(value.references) || !value.references.length ||
    !value.references.every(r => object(r) && text(r.title) && safeReference(r.url)) ||
    !Array.isArray(value.choices) || value.choices.length < 2 ||
    !object(source.structure) || !object(source.bundle) ||
    value.answerId !== source.structure.id) return false;
  const s = source.structure, bundle = source.bundle;
  const choices = value.choices;
  if (!choices.every(c => object(c) && text(c.name) &&
    typeof c.id === 'string' && /^vm:anatomy:(?:body|upper-limb):[a-z0-9-]+:(?:left|right|midline|unpaired|unspecified):[a-z0-9-]+:[a-z0-9-]+$/.test(c.id) &&
    typeof c.fmaId === 'string' && /^FMA\d+$/.test(c.fmaId) &&
    typeof c.laterality === 'string' && sides.includes(c.laterality) &&
    c.laterality === s.laterality && c.id.split(':')[4] === c.laterality &&
    token(c.bundle) && hash(c.bundleSha256) && text(c.nodeName) &&
    ['isa', 'partof'].includes(String(c.sourceTree)) &&
    strings(c.regions) && c.regions.length > 0 && c.regions.every(token) &&
    new Set(c.regions).size === c.regions.length && sourceParts(c.sources)) ||
    new Set(choices.map(c => c.id)).size !== choices.length) return false;
  const answer = choices.find(c => c.id === value.answerId);
  if (!answer || !['id', 'name', 'fmaId', 'laterality', 'bundle', 'nodeName', 'sourceTree']
    .every(k => answer[k] === s[k]) || answer.bundle !== bundle.id ||
    answer.bundleSha256 !== bundle.sha256 || !strings(s.regions) ||
    JSON.stringify(answer.regions) !== JSON.stringify(s.regions) || !sourceParts(s.sources)) return false;
  const sources = s.sources;
  if (answer.sources.length !== sources.length ||
    !answer.sources.every((p: { file: string; sha256: string }, i: number) =>
      p.file === sources[i].file && p.sha256 === sources[i].sha256)) return false;
  return true;
}
/** Validate fields consumed by the read-only UI; never accept a review decision. */
export function parseBodyReviewResponse(
  value: unknown,
  expectedId: string,
): BodyReviewMaterial | null {
  if (
    !object(value) ||
    value.schema !== 'vm-body-review-worksheet-2' ||
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
      if (!validBodyPresentationParts(s as unknown as BodyStructure)) return null;
    } catch { return null; }
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
        (t.correctAnswer === undefined || typeof t.correctAnswer === 'string') &&
        (t.explanation === undefined || typeof t.explanation === 'string') &&
        (t.note === undefined || typeof t.note === 'string'),
    )
  )
    return null;
  if (!validReasoning(value.reasoning, source)) return null;
  const checks = value.checklist;
  if (
    !object(checks) ||
    !['geometry', 'teaching', 'imaging'].every((k) => strings(checks[k])) ||
    !strings(value.limits)
  )
    return null;
  return value as BodyReviewMaterial;
}
