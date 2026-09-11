import type { BodyReviewMaterial } from './body-review-material';
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');
const hash = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
/** Validate fields consumed by the read-only UI; never accept a review decision. */
export function parseBodyReviewResponse(
  value: unknown,
  expectedId: string,
): BodyReviewMaterial | null {
  if (
    !object(value) ||
    value.schema !== 'vm-body-review-worksheet-1' ||
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
        (t.note === undefined || typeof t.note === 'string'),
    )
  )
    return null;
  const checks = value.checklist;
  if (
    !object(checks) ||
    !['geometry', 'teaching', 'imaging'].every((k) => strings(checks[k])) ||
    !strings(value.limits)
  )
    return null;
  return value as BodyReviewMaterial;
}
