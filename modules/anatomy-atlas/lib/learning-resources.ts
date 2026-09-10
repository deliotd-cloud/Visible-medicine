import type {
  AnatomyRepresentation,
  LearningAnchor,
  LearningCorrespondence,
  LearningDocument,
  LearningLocator,
  LearningMatch,
  LearningPolicy,
  LearningResource,
  RepresentationScope,
} from './learning-resource-types';
export type * from './learning-resource-types';
export { learningResourceKinds } from './learning-resource-types';

const idPattern = /^[A-Za-z0-9:_-]{1,220}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const regions = new Set([
  'head-neck',
  'thorax',
  'abdomen',
  'pelvis',
  'shoulder-arm',
  'forearm',
  'hand',
  'thigh',
  'leg',
  'foot',
  'spine',
]);
const scopes = ['body', 'shoulder-pilot', 'nested'];
const kindAnchor = {
  ct: 'volume',
  mri: 'volume',
  xray: 'projection',
  ultrasound: 'ultrasound',
  lecture: 'slide',
  quiz: 'question',
};
const id = (v: unknown): v is string =>
  typeof v === 'string' && idPattern.test(v);
const namespaced = (v: unknown, prefix: string): v is string =>
  id(v) && v.startsWith(prefix) && v.length > prefix.length;
const digest = (v: unknown): v is string =>
  typeof v === 'string' && hashPattern.test(v);
const revision = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Number(v) > 0;
const integer = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0;
function member(value: unknown, options: readonly string[]) {
  return typeof value === 'string' && options.includes(value);
}
function record(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const actual = Reflect.ownKeys(value);
  return (
    actual.length === keys.length &&
    actual.every((key) => typeof key === 'string' && keys.includes(key)) &&
    keys.every(
      (key) =>
        Object.hasOwn(value, key) &&
        Object.hasOwn(
          Object.getOwnPropertyDescriptor(value, key) ?? {},
          'value',
        ),
    )
  );
}
function unique<T>(items: T[], key: (item: T) => string) {
  return new Set(items.map(key)).size === items.length;
}
function sourceSet(value: unknown): value is AnatomyRepresentation['sources'] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 200 &&
    value.every(
      (s) => record(s, ['file', 'sha256']) && id(s.file) && digest(s.sha256),
    ) &&
    unique(value, (s) => s.file)
  );
}
function anatomy(value: unknown): value is AnatomyRepresentation {
  if (!value || typeof value !== 'object') return false;
  const scope = Object.getOwnPropertyDescriptor(value, 'scope')?.value;
  if (scope !== 'nested')
    return (
      record(value, ['scope', 'structureId', 'sources']) &&
      member(value.scope, ['body', 'shoulder-pilot']) &&
      namespaced(value.structureId, 'vm:anatomy:') &&
      sourceSet(value.sources)
    );
  return (
    record(value, ['scope', 'structureId', 'sources', 'nested']) &&
    namespaced(value.structureId, 'vm:anatomy:') &&
    sourceSet(value.sources) &&
    record(value.nested, [
      'study',
      'parentId',
      'parentSources',
      'parentBundleSha256',
      'bundleSha256',
    ]) &&
    member(value.nested.study, [
      'eye',
      'ventricles',
      'brainstem',
      'cerebral',
      'cardiac',
      'pulmonary',
      'hepatic',
    ]) &&
    namespaced(value.nested.parentId, 'vm:anatomy:') &&
    value.nested.parentId !== value.structureId &&
    sourceSet(value.nested.parentSources) &&
    digest(value.nested.parentBundleSha256) &&
    digest(value.nested.bundleSha256)
  );
}
function anchor(value: unknown): value is LearningAnchor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  // Inspect the discriminator without invoking a supplied getter.
  const type = Object.getOwnPropertyDescriptor(value, 'type')?.value;
  switch (type) {
    case 'volume':
      return (
        record(value, [
          'type',
          'id',
          'seriesId',
          'frameId',
          'annotationId',
          'geometry',
        ]) &&
        [value.id, value.seriesId, value.frameId, value.annotationId].every(
          id,
        ) &&
        member(value.geometry, [
          'mask',
          'partial-mask',
          'curve',
          'point',
          'region',
        ])
      );
    case 'projection':
      return (
        record(value, [
          'type',
          'id',
          'imageId',
          'annotationId',
          'projectionId',
        ]) &&
        [value.id, value.imageId, value.annotationId, value.projectionId].every(
          id,
        )
      );
    case 'ultrasound':
      return (
        record(value, [
          'type',
          'id',
          'clipId',
          'annotationId',
          'viewId',
          'frameIndex',
          'timeMs',
        ]) &&
        [value.id, value.clipId, value.annotationId, value.viewId].every(id) &&
        ((integer(value.frameIndex) && value.timeMs === null) ||
          (value.frameIndex === null && integer(value.timeMs)))
      );
    case 'slide':
      return (
        record(value, [
          'type',
          'id',
          'courseId',
          'lessonId',
          'slideId',
          'buildId',
        ]) &&
        [value.id, value.courseId, value.lessonId, value.slideId].every(id) &&
        (value.buildId === null || id(value.buildId))
      );
    case 'question':
      return (
        record(value, ['type', 'id', 'questionId', 'objectiveId']) &&
        [value.id, value.questionId, value.objectiveId].every(id)
      );
    default:
      return false;
  }
}
function resource(value: unknown): value is LearningResource {
  return (
    record(value, [
      'id',
      'revision',
      'kind',
      'title',
      'ageGroup',
      'laterality',
      'regionIds',
      'material',
      'anchors',
    ]) &&
    namespaced(value.id, 'vm:resource:') &&
    revision(value.revision) &&
    member(value.kind, Object.keys(kindAnchor)) &&
    typeof value.title === 'string' &&
    value.title === value.title.trim() &&
    value.title.length > 0 &&
    value.title.length <= 160 &&
    !/[\u0000-\u001f\u007f]/.test(value.title) &&
    member(value.ageGroup, ['adult', 'paediatric', 'mixed', 'unspecified']) &&
    member(value.laterality, [
      'left',
      'right',
      'bilateral',
      'midline',
      'unspecified',
    ]) &&
    Array.isArray(value.regionIds) &&
    value.regionIds.length > 0 &&
    value.regionIds.length <= regions.size &&
    value.regionIds.every((r) => typeof r === 'string' && regions.has(r)) &&
    unique(value.regionIds, (r) => r) &&
    record(value.material, ['sha256', 'origin']) &&
    digest(value.material.sha256) &&
    member(value.material.origin, ['acquired', 'synthetic', 'authored']) &&
    (!['ct', 'mri', 'xray', 'ultrasound'].includes(String(value.kind)) ||
      value.material.origin !== 'authored') &&
    Array.isArray(value.anchors) &&
    value.anchors.length > 0 &&
    value.anchors.length <= 2000 &&
    value.anchors.every(
      (a) =>
        anchor(a) &&
        a.type === kindAnchor[value.kind as keyof typeof kindAnchor],
    ) &&
    unique(value.anchors, (a) => a.id)
  );
}
function correspondence(value: unknown): value is LearningCorrespondence {
  return (
    record(value, [
      'id',
      'revision',
      'anatomy',
      'resourceId',
      'resourceRevision',
      'materialSha256',
      'anchorId',
      'relation',
    ]) &&
    namespaced(value.id, 'vm:link:') &&
    revision(value.revision) &&
    anatomy(value.anatomy) &&
    namespaced(value.resourceId, 'vm:resource:') &&
    revision(value.resourceRevision) &&
    digest(value.materialSha256) &&
    id(value.anchorId) &&
    member(value.relation, ['exact', 'component', 'broader', 'related'])
  );
}

/** Canonical review payload for a host's exact-record approval comparison/hash.
 * Includes annotation/frame/build metadata, not merely an asset digest or version.
 * This payload is not an approval, signature or permission to publish.
 */
export function learningReviewPayload(value: unknown): string | null {
  try {
    if (!resource(value) && !correspondence(value)) return null;
    const canonical = (item: unknown): unknown =>
      Array.isArray(item)
        ? item.map(canonical)
        : item && typeof item === 'object'
          ? Object.fromEntries(
              Object.keys(item)
                .sort()
                .map((key) => [
                  key,
                  canonical((item as Record<string, unknown>)[key]),
                ]),
            )
          : item;
    return JSON.stringify(canonical(value));
  } catch {
    return null;
  }
}

/** Strict, detached transport parsing. It does not grant rights/access/review. */
export function parseLearningDocument(value: unknown): LearningDocument | null {
  try {
    if (
      !record(value, ['schemaVersion', 'resources', 'links']) ||
      (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
      !Array.isArray(value.resources) ||
      value.resources.length > 1000 ||
      !value.resources.every(resource) ||
      !Array.isArray(value.links) ||
      value.links.length > 10000 ||
      !value.links.every(correspondence) ||
      (value.schemaVersion === 1 &&
        value.links.some((link) => link.anatomy.scope === 'nested')) ||
      !unique(value.resources, (r) => r.id) ||
      !unique(value.links, (l) => l.id)
    )
      return null;
    return structuredClone(value) as LearningDocument;
  } catch {
    return null;
  }
}
export function parseLearningJson(text: string): LearningDocument | null {
  // Bound transport bytes before parsing. File/HTTP readers also need body limits.
  if (
    typeof text !== 'string' ||
    text.length > 2_000_000 ||
    new TextEncoder().encode(text).length > 2_000_000
  )
    return null;
  try {
    return parseLearningDocument(JSON.parse(text));
  } catch {
    return null;
  }
}

/** All relevant fields are required; unsupported query fields are not forwarded. */
export function parseLearningLocator(value: unknown): LearningLocator | null {
  try {
    if (
      !record(value, [
        'version',
        'linkId',
        'linkRevision',
        'resourceId',
        'resourceRevision',
        'anchorId',
      ]) ||
      value.version !== 1 ||
      !namespaced(value.linkId, 'vm:link:') ||
      !namespaced(value.resourceId, 'vm:resource:') ||
      !revision(value.linkRevision) ||
      !revision(value.resourceRevision) ||
      !id(value.anchorId)
    )
      return null;
    return structuredClone(value) as LearningLocator;
  } catch {
    return null;
  }
}
export function encodeLearningLocator(value: LearningLocator): string | null {
  const locator = parseLearningLocator(value);
  if (!locator) return null;
  return new URLSearchParams({
    learning: '1',
    link: locator.linkId,
    linkRevision: String(locator.linkRevision),
    resource: locator.resourceId,
    resourceRevision: String(locator.resourceRevision),
    anchor: locator.anchorId,
  }).toString();
}
export function decodeLearningLocator(query: string): LearningLocator | null {
  if (typeof query !== 'string' || query.length > 4096) return null;
  const fields = new URLSearchParams(query);
  const keys = [
    'learning',
    'link',
    'linkRevision',
    'resource',
    'resourceRevision',
    'anchor',
  ];
  if (
    [...fields.keys()].length !== keys.length ||
    [...fields.keys()].some((key) => !keys.includes(key)) ||
    keys.some((key) => fields.getAll(key).length !== 1) ||
    fields.get('learning') !== '1'
  )
    return null;
  const linkRevision = fields.get('linkRevision')!,
    resourceRevision = fields.get('resourceRevision')!;
  if (
    !/^[1-9][0-9]{0,15}$/.test(linkRevision) ||
    !/^[1-9][0-9]{0,15}$/.test(resourceRevision)
  )
    return null;
  return parseLearningLocator({
    version: 1,
    linkId: fields.get('link'),
    linkRevision: Number(linkRevision),
    resourceId: fields.get('resource'),
    resourceRevision: Number(resourceRevision),
    anchorId: fields.get('anchor'),
  });
}

const targetKey = (
  target: Pick<AnatomyRepresentation, 'scope' | 'structureId'>,
) => target.scope + '|' + target.structureId;
const sourceKey = (sources: AnatomyRepresentation['sources']) =>
  JSON.stringify(
    [...sources]
      .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
      .map((s) => [s.file, s.sha256]),
  );
/** Complete anatomical binding identity, not a patient transform or an approval.
 * Source-set ordering is irrelevant; nested parent/study/bundle identity is not. */
export function learningAnatomyBindingKey(value: unknown): string | null {
  try {
    if (!anatomy(value)) return null;
    return JSON.stringify([
      value.scope,
      value.structureId,
      sourceKey(value.sources),
      ...(value.scope === 'nested'
        ? [
            value.nested.study,
            value.nested.parentId,
            sourceKey(value.nested.parentSources),
            value.nested.parentBundleSha256,
            value.nested.bundleSha256,
          ]
        : []),
    ]);
  } catch {
    return null;
  }
}
const locatorFor = (link: LearningCorrespondence): LearningLocator => ({
  version: 1,
  linkId: link.id,
  linkRevision: link.revision,
  resourceId: link.resourceId,
  resourceRevision: link.resourceRevision,
  anchorId: link.anchorId,
});
const deny: LearningPolicy = {
  canNavigate: () => false,
  canAccessAnatomy: () => false,
  canAccess: () => false,
  resourceCleared: () => false,
  correspondenceCleared: () => false,
};

/** Same-process read-only registry, not a network endpoint or authorization store.
 * Supply a trusted current anatomy registry and host-owned policy callbacks.
 * No anatomical alias, side, age or geometry correspondence is inferred.
 */
export function createLearningRegistry(
  input: unknown,
  trustedAnatomy: AnatomyRepresentation[],
  policy: LearningPolicy = deny,
) {
  const document = parseLearningDocument(input);
  if (!document) throw Error('Invalid learning resource document');
  if (
    !Array.isArray(trustedAnatomy) ||
    !trustedAnatomy.every(anatomy) ||
    !unique(trustedAnatomy, targetKey)
  )
    throw Error('Invalid trusted anatomy registry');
  const targets = new Map(
    trustedAnatomy.map((t) => [targetKey(t), structuredClone(t)]),
  );
  const resources = new Map(document.resources.map((r) => [r.id, r]));
  const byTarget = new Map<string, LearningCorrespondence[]>();
  const byAnchor = new Map<string, LearningCorrespondence[]>();
  const links = new Map<string, LearningCorrespondence>();
  const correspondenceKeys = new Set<string>();
  for (const link of document.links) {
    const target = targets.get(targetKey(link.anatomy));
    const r = resources.get(link.resourceId);
    if (
      !target ||
      learningAnatomyBindingKey(target) !==
        learningAnatomyBindingKey(link.anatomy)
    )
      throw Error('Unknown or stale anatomical source binding');
    if (
      !r ||
      r.revision !== link.resourceRevision ||
      r.material.sha256 !== link.materialSha256 ||
      !r.anchors.some((a) => a.id === link.anchorId)
    )
      throw Error('Unknown or stale learning-resource binding');
    const duplicateKey =
      targetKey(link.anatomy) + '|' + link.resourceId + '|' + link.anchorId;
    if (correspondenceKeys.has(duplicateKey))
      throw Error('Duplicate anatomy/resource correspondence');
    correspondenceKeys.add(duplicateKey);
    links.set(link.id, link);
    const tk = targetKey(link.anatomy),
      ak = link.resourceId + '|' + link.anchorId;
    byTarget.set(tk, [...(byTarget.get(tk) ?? []), link]);
    byAnchor.set(ak, [...(byAnchor.get(ak) ?? []), link]);
  }
  // Return copies to both callers and policies; neither can alter indexed source.
  function match(link: LearningCorrespondence): LearningMatch | null {
    const r = resources.get(link.resourceId)!;
    try {
      if (
        policy.canNavigate() !== true ||
        policy.canAccessAnatomy(structuredClone(link.anatomy)) !== true ||
        policy.canAccess(structuredClone(r)) !== true ||
        policy.resourceCleared(structuredClone(r)) !== true ||
        policy.correspondenceCleared(structuredClone(link)) !== true
      )
        return null;
    } catch {
      return null;
    }
    return structuredClone({
      resource: r,
      anchor: r.anchors.find((a) => a.id === link.anchorId)!,
      link,
      locator: locatorFor(link),
    });
  }
  return {
    related(scope: RepresentationScope, structureId: string): LearningMatch[] {
      if (!scopes.includes(scope) || !id(structureId)) return [];
      return (byTarget.get(targetKey({ scope, structureId })) ?? [])
        .map(match)
        .filter((m): m is LearningMatch => m !== null);
    },
    anatomyFor(resourceId: string, anchorId: string): LearningMatch[] {
      if (!id(resourceId) || !id(anchorId)) return [];
      return (byAnchor.get(resourceId + '|' + anchorId) ?? [])
        .map(match)
        .filter((m): m is LearningMatch => m !== null);
    },
    resolve(
      value: unknown,
    ): { status: 'ready'; match: LearningMatch } | { status: 'unavailable' } {
      const locator = parseLearningLocator(value);
      if (!locator) return { status: 'unavailable' };
      const link = links.get(locator.linkId);
      if (
        !link ||
        Object.entries(locatorFor(link)).some(
          ([key, value]) => locator[key as keyof LearningLocator] !== value,
        )
      )
        return { status: 'unavailable' };
      const ready = match(link);
      return ready
        ? { status: 'ready', match: ready }
        : { status: 'unavailable' };
    },
  };
}
