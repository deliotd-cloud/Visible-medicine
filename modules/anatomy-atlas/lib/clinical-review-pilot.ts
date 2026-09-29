import type { ClinicalReviewEntry } from './clinical-review-index';

/** Identity-only calibration sample, never an approval or release allowlist. */
export const reviewPilotRoots = [
  ['FMA13395', 'vm:anatomy:upper-limb:shoulder:right:bone:scapula'],
  ['FMA13396', 'vm:anatomy:body:shoulder-arm:left:bone:left-scapula'],
  ['FMA32544', 'vm:anatomy:upper-limb:shoulder:right:muscle:supraspinatus'],
  ['FMA32545', 'vm:anatomy:body:shoulder-arm:left:muscle:left-supraspinatus'],
  ['FMA24474', 'vm:anatomy:body:thigh:right:bone:right-femur'],
  ['FMA24475', 'vm:anatomy:body:thigh:left:bone:left-femur'],
  ['FMA50737', 'vm:anatomy:body:abdomen:unspecified:vessel:celiac-artery'],
  ['FMA7088', 'vm:anatomy:body:thorax:unpaired:organ:heart'],
  ['FMA50801', 'vm:anatomy:body:head-neck:midline:organ:brain'],
] as const;
export const reviewPilotNested = [
  ['ventricles', 'FMA78454', 'vm:anatomy:body:head-neck:midline:organ:brain', 'vm:anatomy:body:head-neck:midline:space:third-ventricle'],
  ['cardiac', 'FMA9466', 'vm:anatomy:body:thorax:unpaired:organ:heart', 'vm:anatomy:body:thorax:left:organ:cavity-of-left-ventricle'],
] as const;

/** Resolve against current entries so nested source tokens cannot become stale. */
export function resolveReviewPilot(entries: readonly ClinicalReviewEntry[]): ClinicalReviewEntry[] {
  const keys = [
    ...reviewPilotRoots.map(([, id]) => 'body:' + id),
    ...reviewPilotNested.map(([study, , parent, id]) => 'nested:' + JSON.stringify([JSON.stringify([parent, study]), id])),
  ];
  return keys.map(key => {
    const matches = entries.filter(entry => entry.key === key);
    if (matches.length !== 1) throw Error('Starter review identity must resolve exactly: ' + key);
    return { ...matches[0] };
  });
}
