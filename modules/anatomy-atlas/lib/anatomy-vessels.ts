import type { BodyStructure } from '../app/body-types';

type VesselIdentity = Pick<BodyStructure, 'system' | 'sourceName' | 'fmaId'>;
export type VesselKind = 'artery' | 'vein' | 'unclassified';
// Exact source identities whose names omit an arterial noun. Unknown identities
// remain neutral; colours never imply oxygenation, flow or verified continuity.
const arterialNames: Readonly<Record<string, string>> = {
  FMA22839: 'right deep palmar arch',
  FMA22840: 'left deep palmar arch',
  FMA3992: 'right thyrocervical trunk',
  FMA4084: 'left thyrocervical trunk',
  FMA5039: 'right costocervical trunk',
  FMA4086: 'left costocervical trunk',
};
export function vesselKind(s: VesselIdentity): VesselKind {
  if (s.system !== 'vessels') return 'unclassified';
  const vein = /\b(?:vein|veins|venous|vena|venae)\b/i.test(s.sourceName);
  const artery =
    /\b(?:artery|arteries|arteria|arterial|aorta|aortic)\b/i.test(
      s.sourceName,
    ) || arterialNames[s.fmaId] === s.sourceName;
  return vein === artery ? 'unclassified' : vein ? 'vein' : 'artery';
}
export const vesselColors: Readonly<Record<VesselKind, string>> = {
  artery: '#bf4847',
  vein: '#577fba',
  unclassified: '#8b94a1',
};
export const vesselColor = (s: VesselIdentity) => vesselColors[vesselKind(s)];
