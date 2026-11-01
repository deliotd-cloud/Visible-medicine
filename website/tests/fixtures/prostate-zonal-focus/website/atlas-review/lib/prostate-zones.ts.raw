import revision from '../content/prostate-zones-revision.json' with { type: 'json' };

export type ProstateZoneKey = 'peripheral' | 'transition' | 'central' | 'stroma';
export const PROSTATE_ZONE_REVISION = revision.sha256;
export const PROSTATE_PARENT_ID = 'vm:anatomy:body:pelvis:unpaired:organ:prostate';
export const PROSTATE_PARENT_SOURCE = {
  fmaId: 'FMA9600', file: 'FJ3139',
  sha256: 'f20448e74cf6b6096248361bc4f618c1d7f4c1acac77f785abc43e40835b13cb',
} as const;
export const prostateZones = [
  {
    key: 'peripheral', id: `${PROSTATE_PARENT_ID}:zone:peripheral`,
    name: 'Peripheral zone', shortLabel: 'PZ', color: '#b96771',
    anatomy: 'The outer glandular region occupies much of the posterior and lateral prostate and extends toward the apex.',
    mri: 'Compare the peripheral zone on T2-weighted MRI. Its boundary and appearance must be identified on the actual scan.',
  },
  {
    key: 'transition', id: `${PROSTATE_PARENT_ID}:zone:transition`,
    name: 'Transition zone', shortLabel: 'TZ', color: '#d7a55e',
    anatomy: 'Paired periurethral glandular regions lie around the proximal prostatic urethra. Their size varies, particularly with benign enlargement.',
    mri: 'Identify the transition zone separately from the central zone. This illustration does not model a particular degree of enlargement.',
  },
  {
    key: 'central', id: `${PROSTATE_PARENT_ID}:zone:central`,
    name: 'Central zone', shortLabel: 'CZ', color: '#7b89bd',
    anatomy: 'A basal, tapered glandular region surrounds the ejaculatory ducts and narrows toward their opening into the urethra.',
    mri: 'Check its extent across axial, coronal and sagittal images. Do not treat the combined transition and central zones as one labelled zone.',
  },
  {
    key: 'stroma', id: `${PROSTATE_PARENT_ID}:region:anterior-fibromuscular-stroma`,
    name: 'Anterior fibromuscular stroma', shortLabel: 'AFS', color: '#4d9c9a',
    anatomy: 'An anterior region of fibrous and muscular tissue, distinct from the three glandular zones.',
    mri: 'Keep this non-glandular region separately identified when comparing the anterior prostate on MRI.',
  },
] as const satisfies readonly {
  key: ProstateZoneKey; id: string; name: string; shortLabel: string;
  color: string; anatomy: string; mri: string;
}[];

/** An anatomical concept link carries no implied image coordinates or registration. */
export function prostateConceptSelection(key: ProstateZoneKey) {
  const zone = prostateZones.find(item => item.key === key);
  if (!zone) throw new Error('Unknown prostate zone');
  return {
    schema: 'vm.prostate-zone-selection/1' as const,
    conceptId: zone.id, parentId: PROSTATE_PARENT_ID,
    atlasRevision: PROSTATE_ZONE_REVISION,
    representation: 'original-schematic' as const,
    coordinateFrame: 'vm:prostate:schematic:local-v1' as const,
    patientSpaceRegistration: null,
  };
}

/** Parent binding is identity/provenance only; no fitting of the schematic to source voxels. */
export function prostateZonesAvailable(parent: {
  id: string; fmaId: string; sourceTree: string;
  sources: {file: string; sha256: string}[];
} | null) {
  return !!parent && parent.id === PROSTATE_PARENT_ID && parent.fmaId === PROSTATE_PARENT_SOURCE.fmaId
    && parent.sourceTree === 'partof' && parent.sources.length === 1
    && parent.sources[0].file === PROSTATE_PARENT_SOURCE.file
    && parent.sources[0].sha256 === PROSTATE_PARENT_SOURCE.sha256;
}
