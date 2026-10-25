/** Draft navigation between the approved head display manifest and the generic Atlas.
 * The studies are different, unregistered subjects. This is concept navigation only.
 * Recheck these pins whenever either source manifest changes; no image geometry is shared.
 */
export const HEAD_LINK_REVISION = '0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5';

export type HeadEntry = {
  id: string;
  label: string;
  laterality?: string;
  representation?: string;
  source?: unknown;
};
export type HeadModality = 'CT' | 'MRI';
export type HeadConceptLink = {
  conceptId: string;
  label: string;
  atlasHref: string;
  ctHref?: string;
  mriHref?: string;
  scopeNote: string;
  headRevision: string;
};

type Concept = {
  id: string;
  label: string;
  suffix: string;
  side: 'both' | 'left' | 'right';
  ct?: string;
  mri?: string;
  representation: 'mask' | 'partial-mask';
  mriRepresentation?: 'mask' | 'partial-mask';
  atlasId: string;
  atlasSource?: string;
  detail?: 'brainstem' | 'ventricles' | 'cerebral';
  partSource?: string;
  rawLabel?: string;
};

const root = 'vm:anatomy:body:head-neck:';
const concepts: readonly Concept[] = [
  ...(['left', 'right'] as const).map((side): Concept => ({
    id: `orbit-${side}-globe`, label: `${side === 'left' ? 'Left' : 'Right'} globe`,
    suffix: `${side === 'left' ? 'Left' : 'Right'} globe`, side,
    ct: `cth.orb.globe.${side}`, mri: `mrb.orb.globe.${side}`,
    representation: 'mask', mriRepresentation: 'partial-mask',
    atlasId: `${root}${side}:organ:${side}-eyeball`,
    atlasSource: '7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915',
  })),
  { id: 'brainstem-midbrain', label: 'Midbrain', suffix: 'Midbrain', side: 'both', ct: 'cth.bst.midbrain', mri: 'mrb.bst.midbrain', representation: 'partial-mask', atlasId: `${root}midline:organ:midbrain`, detail: 'brainstem' },
  { id: 'brainstem-pons', label: 'Pons', suffix: 'Pons', side: 'both', ct: 'cth.bst.pons', mri: 'mrb.bst.pons', representation: 'partial-mask', atlasId: `${root}midline:organ:pons`, detail: 'brainstem' },
  { id: 'brainstem-medulla', label: 'Medulla oblongata', suffix: 'Medulla oblongata', side: 'both', ct: 'cth.bst.medulla_oblongata', mri: 'mrb.bst.medulla_oblongata', representation: 'partial-mask', atlasId: `${root}midline:organ:medulla-oblongata`, detail: 'brainstem' },
  { id: 'ventricle-left-lateral', label: 'Left lateral ventricle', suffix: 'Left lateral ventricle', side: 'left', ct: 'cth.vnt.lateral_ventricle.left', mri: 'mrb.vnt.lateral_ventricle.left', representation: 'mask', atlasId: `${root}left:space:left-lateral-ventricle`, detail: 'ventricles' },
  { id: 'ventricle-right-lateral', label: 'Right lateral ventricle', suffix: 'Right lateral ventricle', side: 'right', ct: 'cth.vnt.lateral_ventricle.right', mri: 'mrb.vnt.lateral_ventricle.right', representation: 'mask', atlasId: `${root}right:space:right-lateral-ventricle`, detail: 'ventricles' },
  { id: 'ventricle-third', label: 'Third ventricle', suffix: 'Third ventricle', side: 'both', ct: 'cth.vnt.third_ventricle', mri: 'mrb.vnt.third_ventricle', representation: 'mask', atlasId: `${root}midline:space:third-ventricle`, detail: 'ventricles' },
  { id: 'ventricle-fourth', label: 'Fourth ventricle', suffix: 'Fourth ventricle', side: 'both', ct: 'cth.vnt.fourth_ventricle', mri: 'mrb.vnt.fourth_ventricle', representation: 'mask', atlasId: `${root}midline:space:fourth-ventricle`, detail: 'ventricles' },
  ...(['left', 'right'] as const).flatMap((side) => ([
    ['caudate', 'Caudate nucleus', 'caudate_nucleus', 'caudate-nucleus'],
    ['putamen', 'Putamen', 'putamen', 'putamen'],
    ['globus-pallidus', 'Globus pallidus', 'globus_pallidus', 'globus-pallidus'],
    ['thalamus', 'Thalamus', 'thalamus', 'thalamus'],
  ] as const).map(([key, title, imageName, atlasName]): Concept => ({
    id: `deep-${side}-${key}`, label: `${side === 'left' ? 'Left' : 'Right'} ${title.toLowerCase()}`,
    suffix: `${side === 'left' ? 'Left' : 'Right'} ${title.toLowerCase()}`, side,
    ct: `cth.dgm.${imageName}.${side}`, mri: `mrb.dgm.${imageName}.${side}`,
    representation: 'mask', atlasId: `${root}${side}:organ:${side}-${atlasName}`,
  }))),
  ...(['left', 'right'] as const).flatMap((side) =>
    (['frontal', 'parietal', 'temporal', 'occipital'] as const).map((lobe): Concept => ({
      id: `cortex-${side}-${lobe}-lobe`, label: `${side === 'left' ? 'Left' : 'Right'} ${lobe} lobe`,
      suffix: `${side === 'left' ? 'Left' : 'Right'} ${lobe} lobe`, side,
      ct: `cth.ctx.${lobe}_lobe.${side}`, mri: `mrb.ctx.${lobe}_lobe.${side}`,
      representation: 'mask', atlasId: `${root}${side}:organ:${side}-${lobe}-lobe`, detail: 'cerebral',
    }))),
  ...(['left', 'right'] as const).map((side): Concept => ({
    id: `cortex-${side}-insula`, label: `${side === 'left' ? 'Left' : 'Right'} insula`,
    suffix: `${side === 'left' ? 'Left' : 'Right'} insula`, side,
    ct: `cth.ctx.insula.${side}`, mri: `mrb.ctx.insula.${side}`,
    representation: 'mask', mriRepresentation: 'partial-mask',
    atlasId: `${root}${side}:organ:${side}-insula`, detail: 'cerebral',
  })),
  ...(['left', 'right'] as const).map((side): Concept => ({
    id: `limbic-${side}-hippocampus`, label: `${side === 'left' ? 'Left' : 'Right'} hippocampus`,
    suffix: `${side === 'left' ? 'Left' : 'Right'} hippocampus`, side,
    ct: `cth.dgm.hippocampus.${side}`, mri: `mrb.dgm.hippocampus.${side}`,
    representation: 'mask', atlasId: `${root}${side}:organ:${side}-hippocampus`, detail: 'cerebral',
    partSource: '11cf97da7aa459f1181c79278b41c9c4369f8954eb5d4a00d1bc22b5cf28964e',
  })),
  ...(['left', 'right'] as const).map((side): Concept => ({
    id: `limbic-${side}-amygdala`, label: `${side === 'left' ? 'Left' : 'Right'} amygdala`,
    suffix: `${side === 'left' ? 'Left' : 'Right'} amygdala`, side,
    mri: `mrb.dgm.amygdala.${side}`, representation: 'mask',
    atlasId: `${root}${side}:organ:${side}-amygdala`,
  })),
  { id: 'commissure-corpus-callosum', label: 'Corpus callosum', suffix: 'Corpus callosum', side: 'both',
    mri: 'mrb.wmt.corpus_callosum', representation: 'partial-mask', atlasId: `${root}midline:organ:corpus-callosum` },
  { id: 'endocrine-pituitary-gland', label: 'Pituitary gland', suffix: 'Pituitary gland', side: 'both',
    mri: 'mrb.orb.pituitary_gland', representation: 'mask', atlasId: `${root}unpaired:organ:pituitary-gland`,
    atlasSource: '7fe91d4bfe3a5aa96bc77b83d10ab07775892328acc081dab6fb92b0c0c40915' },
  ...(['left', 'right'] as const).flatMap(side =>
    (['parietal', 'nasal'] as const).map(bone => ({
      id: `bone-${side}-${bone}`, label: `${side === 'left' ? 'Left' : 'Right'} ${bone} bone`,
      suffix: `${side === 'left' ? 'Left' : 'Right'} ${bone} bone`, side,
      ct: `cth.${bone === 'nasal' ? 'fac' : 'skl'}.${bone}_bone.${side}`,
      representation: 'partial-mask' as const, atlasId: `${root}${side}:bone:${side}-${bone}-bone`,
      atlasSource: 'c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4',
    }))),
  ...(['occipital', 'ethmoid'] as const).map(bone => ({
    id: `bone-${bone}`, label: `${bone === 'occipital' ? 'Occipital' : 'Ethmoid'} bone`,
    suffix: `${bone === 'occipital' ? 'Occipital' : 'Ethmoid'} bone`, side: 'both' as const,
    ct: `cth.skl.${bone}_bone`, representation: 'partial-mask' as const,
    atlasId: `${root}midline:bone:${bone === 'ethmoid' ? 'ethmoid' : 'occipital-bone'}`,
    atlasSource: 'c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4',
  })),
  ...(['left', 'right'] as const).map((side): Concept => ({
    id: `bone-${side}-zygomatic`, label: `${side === 'left' ? 'Left' : 'Right'} zygomatic bone`,
    suffix: `${side === 'left' ? 'Left' : 'Right'} zygomatic bone`, side,
    rawLabel: `${side === 'left' ? 'Left' : 'Right'} zygomatic bone — limited region`,
    ct: `cth.fac.zygomatic_bone.${side}`, representation: 'partial-mask',
    atlasId: `${root}${side}:bone:${side}-zygomatic-bone`,
    atlasSource: 'c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4',
  })),
  {id:'bone-mandible',label:'Mandible',suffix:'Mandible',side:'both',ct:'cth.fac.mandible',
    representation:'mask',atlasId:`${root}midline:bone:mandible`,
    atlasSource:'c1b950c82fd76e69cf153757ca275a6bd27fd25d74d3fd24259b15f9172a39d4'},
];

const brain = `${root}midline:organ:brain`;
const brainBundle = 'f68b34d46c0c6273b687e3c8c890541a34cb2c66cbb383a5a9783e4a5990d335';
const nestedHashes = {
  brainstem: 'fd1d8d04656a300fe0e8271a418ec0807b227baa96d6afa822d0df6ad0bf72ba',
  ventricles: 'e99326a0fd0b0bdc0a64d2a1adbb7a63c758af6f765199b8febe851e62b9eab1',
  cerebral: '7a62de7b68d7fe823b299ad5dfc9eb628db7a105d120f571789eacf7b3314410',
} as const;
const deepBundle = '6046dacb923f5103acb3b86dadf2817b5f0c133af88e0d225170cf331fbd0e3c';

function atlasHref(concept: Concept): string {
  const query = new URLSearchParams({
    study: concept.detail ? '2' : '1',
    structure: concept.detail ? brain : concept.atlasId,
    side: concept.side,
    source: concept.detail ? brainBundle : concept.atlasSource ?? deepBundle,
  });
  if (concept.detail) {
    query.set('detail', concept.detail);
    query.set('part', concept.atlasId);
    query.set('partSource', concept.partSource ?? nestedHashes[concept.detail]);
  }
  query.set('concept', concept.id);
  return `/atlas/head-neck-3d?${query}`;
}

function matchingEntry(entry: HeadEntry, concept: Concept, modality: HeadModality): boolean {
  const nativeId = modality === 'CT' ? concept.ct : concept.mri;
  return typeof nativeId === 'string' && entry.id === nativeId &&
    entry.label === (concept.rawLabel ?? `${concept.suffix} — regional mask`) &&
    entry.representation === (modality === 'MRI' ? concept.mriRepresentation ?? concept.representation : concept.representation) &&
    entry.laterality === (concept.side === 'both' ? 'midline_or_unpaired' : concept.side);
}

function link(concept: Concept): HeadConceptLink {
  return {
    conceptId: concept.id,
    label: concept.label,
    atlasHref: atlasHref(concept),
    ...(concept.ct ? {ctHref: `/atlas/ct-head?concept=${concept.id}`} : {}),
    ...(concept.mri ? {mriHref: `/atlas/mri-head?concept=${concept.id}`} : {}),
    scopeNote: concept.id === 'bone-mandible'
      ? 'Draft CT-only anatomy concept link. A saved mask representation does not establish whole-mandible coverage or anatomical completeness. CT and the generic 3D mandible are separate, unregistered subjects; inspect their actual extents independently. No exact MRI comparison, spatial correspondence, fracture assessment or clinical sign-off.'
      : !concept.mri
      ? 'Draft CT-only anatomy concept link. The saved CT mask covers a regional portion, not the whole bone; the generic 3D surface may cover a different extent. No exact MRI comparison is mapped. CT and the generic Atlas are separate, unregistered subjects; no spatial correspondence or clinical sign-off.'
      : !concept.ct
      ? `Draft MRI-only anatomy concept link. ${concept.representation === 'partial-mask' ? 'Saved MRI mask covers a regional portion only. ' : ''}No exact whole-concept CT comparison is mapped; points, subparts and neighbouring structures are not substitutes. MRI and the generic Atlas are separate, unregistered subjects; no spatial correspondence or clinical sign-off.`
      : concept.mriRepresentation === 'partial-mask' && concept.representation === 'mask'
      ? 'Draft anatomy concept link. CT mask and partial MRI mask have different coverage; the MRI mask covers a regional portion only. CT, MRI and generic Atlas are separate, unregistered subjects. No spatial correspondence or clinical sign-off.'
      : concept.detail === 'cerebral'
      ? 'Draft anatomy concept link. Saved image masks and generic 3D regions may cover different extents; CT, MRI and generic Atlas are separate, unregistered subjects. No spatial correspondence or clinical sign-off.'
      : concept.representation === 'partial-mask'
      ? 'Draft anatomy concept link. Head mask covers a regional portion only; separate subjects and generic Atlas are unregistered.'
      : 'Draft anatomy concept link. CT, MRI and generic Atlas are separate, unregistered subjects; no spatial correspondence or clinical sign-off.',
    headRevision: HEAD_LINK_REVISION,
  };
}

/** An allowlisted entry must match ID, display label, laterality, and representation. */
export function headAtlasConcept(entry: HeadEntry, modality: HeadModality): HeadConceptLink | null {
  if (modality !== 'CT' && modality !== 'MRI') return null;
  const concept = concepts.find((candidate) => matchingEntry(entry, candidate, modality));
  return concept ? link(concept) : null;
}

export function headConceptById(id: string): HeadConceptLink | null {
  const concept = concepts.find((candidate) => candidate.id === id);
  return concept ? link(concept) : null;
}

/** Picker metadata only; source-pinned destinations still come from headConceptById. */
export function headAtlasConceptOptions():Array<{conceptId:string;label:string}> {
  return concepts.map(concept=>({conceptId:concept.id,label:concept.label}));
}

type ConceptQuery = URLSearchParams | Record<string, string | string[] | undefined>;
const atlasQueryKeys = ['concept', 'study', 'structure', 'side', 'source', 'focus', 'detail', 'part', 'partSource'] as const;

/** Accept an Atlas return link only when its full study contract matches our pinned target. */
export function headConceptFromAtlasQuery(params: ConceptQuery): HeadConceptLink | null {
  if (!params || typeof params !== 'object') return null;
  const value = (key: string): string | null => {
    const values = params instanceof URLSearchParams ? params.getAll(key) : params[key];
    if (Array.isArray(values)) return params instanceof URLSearchParams && values.length === 1 ? values[0] : null;
    return typeof values === 'string' ? values : null;
  };
  const id = value('concept');
  const match = concepts.find((concept) => concept.id === id);
  if (!match) return null;
  const expected = new URL(atlasHref(match), 'https://example.invalid').searchParams;
  for (const key of atlasQueryKeys) {
    const actual = params instanceof URLSearchParams ? params.getAll(key) : params[key];
    if (Array.isArray(actual) && (!(params instanceof URLSearchParams) || actual.length > 1)) return null;
    if (value(key) !== expected.get(key)) return null;
  }
  return link(match);
}

export function parseHeadConcept(query: ConceptQuery): string | null {
  const value = query instanceof URLSearchParams ? query.getAll('concept') : query.concept;
  const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : null : value;
  return typeof candidate === 'string' && concepts.some((item) => item.id === candidate) ? candidate : null;
}

/** Reverse navigation resolves against the currently loaded manifest's exact entry. */
export function resolveHeadConcept(entries: readonly HeadEntry[], conceptId: string, modality: HeadModality): HeadEntry | null {
  const concept = concepts.find((candidate) => candidate.id === conceptId);
  if (!Array.isArray(entries) || !concept || (modality !== 'CT' && modality !== 'MRI')) return null;
  const nativeId=modality==='CT'?concept.ct:concept.mri;
  if(!nativeId)return null;
  const matches=entries.filter((entry) => entry.id===nativeId);
  return matches.length===1&&matchingEntry(matches[0],concept,modality)?matches[0]:null;
}
