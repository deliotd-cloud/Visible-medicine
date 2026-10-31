import type { InboxItem, InboxStatus } from './clinical-review-inbox-contract';

export type QuickReviewTrack = 'Anatomy' | 'Teaching';
export type QuickReviewRegion = string | null;
export type QuickReviewSelection = {
  regions: { id: string; label: string }[];
  groups: string[];
  groupOptions: { key: string; label: string }[];
  count: number;
  partial: boolean;
  item: InboxItem | null;
};

const priority: Partial<Record<InboxStatus, number>> = {
  'changes-required': 0,
  're-review': 1,
  'in-progress': 2,
  'not-started': 3,
};
const bodyRegions = [
  ['head-neck', 'Head & neck'], ['thorax', 'Thorax'], ['abdomen', 'Abdomen'],
  ['pelvis', 'Pelvis & hip'], ['shoulder-arm', 'Shoulder & arm'],
  ['forearm', 'Elbow & forearm'], ['hand', 'Wrist & hand'],
  ['thigh', 'Hip & thigh'], ['leg', 'Knee & leg'], ['foot', 'Ankle & foot'],
  ['spine', 'Spine & back'],
] as const;
const bodyRegionIds = new Set<string>(bodyRegions.map(([id]) => id));
const knownRegions: { id: string; label: string }[] = [
  { id: 'shoulder', label: 'Dedicated shoulder' },
  ...bodyRegions.map(([id, label]) => ({ id: `body:${id}`, label })),
  { id: 'nested', label: 'Internal anatomy' },
  { id: 'specimens', label: 'Independent specimens' },
  { id: 'other', label: 'Other source area' },
];

export function quickReviewRegionLabel(region: string): string {
  return knownRegions.find(option => option.id === region)?.label ?? 'Other source area';
}

/** Source-area navigation only. The exact group, revision and destination remain on each item. */
export function quickReviewRegions(item: InboxItem): string[] {
  const path = item.href.split(/[?#]/, 1)[0];
  if (path === '/workspace/atlas-review/shoulder' && item.scopeLabel.startsWith('Dedicated shoulder · ')) return ['shoulder'];
  if (path === '/workspace/atlas-review/nested') return ['nested'];
  if (path === '/workspace/atlas-review/specimens') return ['specimens'];
  if (path === '/workspace/atlas-review/body' && item.scopeLabel.startsWith('Whole body · ')) {
    // The source context is "Whole body · <region IDs> · <system> · FMA… · <side>".
    // Only exact known region tokens count; a malformed or future source stays visible in Other.
    const tokens = item.scopeLabel.split(' · ').slice(1);
    const ids: string[] = [];
    for (const token of tokens) {
      if (!bodyRegionIds.has(token)) break;
      if (!ids.includes(token)) ids.push(token);
    }
    if (ids.length) return ids.map(id => `body:${id}`);
  }
  return ['other'];
}

/** Display text only: the exact scope remains the option value and filter key. */
function readableGroupContext(scope: string): string {
  if (!scope.trim()) return 'Unspecified group';
  const parts = scope.split(' · ');
  if (parts[0] === 'Whole body') {
    const regions: string[] = [];
    let index = 1;
    while (index < parts.length && bodyRegionIds.has(parts[index])) {
      regions.push(bodyRegions.find(([id]) => id === parts[index])![1]);
      index++;
    }
    // Unknown or malformed source areas need their original wording in navigation.
    if (!regions.length || parts.length - index !== 3 || !parts[index].trim()
      || !/^FMA\d+$/.test(parts[index + 1]) || !parts[index + 2].trim()) {
      return `Unrecognized source scope: ${scope}`;
    }
    return ['Whole body', ...regions, parts[index], parts[index + 2]].join(' · ');
  }
  if (parts[0] === 'Dedicated shoulder') {
    if (parts.length !== 5 || !parts[1].trim() || !parts[2].trim()
      || !/^FMA\d+$/.test(parts[3]) || !parts[4].trim()) return `Unrecognized source scope: ${scope}`;
    return [parts[0], parts[1], parts[2], parts[4]].join(' · ');
  }
  return scope;
}

function quickReviewGroupOptions(items: readonly InboxItem[], groups: readonly string[]): { key: string; label: string }[] {
  const titlesByScope = new Map<string, Set<string>>();
  for (const item of items) {
    let titles = titlesByScope.get(item.scopeLabel);
    if (!titles) {
      titles = new Set<string>();
      titlesByScope.set(item.scopeLabel, titles);
    }
    if (item.title.trim()) titles.add(item.title.trim());
  }
  const base = groups.map(key => {
    // Keep every distinct title, including source-group, partial and specimen qualifiers.
    const titles = [...(titlesByScope.get(key) ?? [])];
    return { key, label: `${titles.join(', ') || 'Unnamed structure'} · ${readableGroupContext(key)}` };
  });
  const counts = new Map<string, number>();
  for (const option of base) counts.set(option.label, (counts.get(option.label) ?? 0) + 1);
  return base.map(option => counts.get(option.label)! > 1
    ? { ...option, label: `${option.label} · ${option.key || 'Unspecified group'}` }
    : option).sort((a, b) => a.label.localeCompare(b.label, 'en') || a.key.localeCompare(b.key, 'en'));
}

/** Selects only loaded, validated structure decisions; never creates a review action. */
export function selectQuickReview(
  items: readonly InboxItem[],
  track: QuickReviewTrack,
  region: QuickReviewRegion,
  group: string | null,
  scanComplete: boolean,
): QuickReviewSelection {
  const eligible = items.filter(item => item.area === 'structures'
    && item.capability === 'decision'
    && /^[a-f0-9]{64}$/.test(item.revision ?? '')
    && item.trackLabel === track
    && Object.hasOwn(priority, item.status));
  const mapped = eligible.map(item => ({ item, regions: quickReviewRegions(item) }));
  const present = new Set(mapped.flatMap(row => row.regions));
  const regions = knownRegions.filter(option => present.has(option.id));
  const inRegion = region === null ? eligible : mapped.filter(row => row.regions.includes(region)).map(row => row.item);
  const groups = [...new Set(inRegion.map(item => item.scopeLabel))].sort((a, b) => a.localeCompare(b));
  const groupOptions = quickReviewGroupOptions(inRegion, groups);
  const selected = group === null ? inRegion : inRegion.filter(item => item.scopeLabel === group);
  // Stable source order resolves equal status without inferring a clinical priority.
  const item = selected.reduce<InboxItem | null>((best, next) =>
    best === null || priority[next.status]! < priority[best.status]! ? next : best, null);
  return { regions, groups, groupOptions, count: selected.length, partial: !scanComplete, item };
}

