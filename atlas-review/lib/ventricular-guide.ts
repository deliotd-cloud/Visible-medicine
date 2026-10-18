import pins from '../content/nested-teaching-bindings.v1.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { guidedPlaybackEvidence } from './guided-playback';
import { ventricleCatalog, ventriclesFor } from './ventricles';

export const ventricularGuideReferences = [
  { title: 'UT Health · Neuroanatomy Online: The Ventricles', url: 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html' },
  { title: 'NCBI Bookshelf · The Ventricular System', url: 'https://www.ncbi.nlm.nih.gov/books/NBK11083/' },
] as const;

export type VentricularGuide = {
  id: string;
  title: string;
  status: 'draft';
  parentId: string;
  study: 'ventricles';
  transitionMs: 1800;
  continuousPlayback: ReturnType<typeof guidedPlaybackEvidence>;
  fadeOthers: true;
  limitation: string;
  steps: Array<{
    id: string;
    title: string;
    caption: string;
    preset: 'all' | 'lateral' | 'midline';
    selectedId: string;
    view: DissectionView;
    ids: string[];
    references: string[];
  }>;
};

const expected = [
  { fmaId: 'FMA78450', id: 'vm:anatomy:body:head-neck:left:space:left-lateral-ventricle', laterality: 'left' },
  { fmaId: 'FMA78449', id: 'vm:anatomy:body:head-neck:right:space:right-lateral-ventricle', laterality: 'right' },
  { fmaId: 'FMA78454', id: 'vm:anatomy:body:head-neck:midline:space:third-ventricle', laterality: 'midline' },
  { fmaId: 'FMA78469', id: 'vm:anatomy:body:head-neck:midline:space:fourth-ventricle', laterality: 'midline' },
] as const;
const bundleSha256 = 'e99326a0fd0b0bdc0a64d2a1adbb7a63c758af6f765199b8febe851e62b9eab1';

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
    ).join(',')}}`;
  return JSON.stringify(value);
};

const stops: Array<{
  id: string;
  title: string;
  caption: string;
  preset: VentricularGuide['steps'][number]['preset'];
  selected: number;
  view: DissectionView;
}> = [
  {
    id: 'overview', title: 'Four ventricular spaces', preset: 'all', selected: 0, view: 'anterior',
    caption: 'The two lateral ventricles and the third and fourth ventricles are four source-labelled spaces. Their intervening channels are not separate selections here.',
  },
  {
    id: 'paired-lateral', title: 'Paired lateral ventricles', preset: 'lateral', selected: 1, view: 'anterior',
    caption: 'One lateral ventricle lies in each cerebral hemisphere. Their horns remain grouped within one selection per side; selecting the right space does not isolate a horn.',
  },
  {
    id: 'third', title: 'Third ventricle', preset: 'midline', selected: 2, view: 'left',
    caption: 'The third ventricle is a narrow midline space in the diencephalon. Its usual connections to the lateral ventricles pass through foramina absent from this model.',
  },
  {
    id: 'fourth', title: 'Fourth ventricle', preset: 'midline', selected: 3, view: 'posterior',
    caption: 'The fourth ventricle lies between the brainstem and cerebellum. The cerebral aqueduct and fourth-ventricle outlets are not individually represented by these surfaces.',
  },
  {
    id: 'return-overview', title: 'Return to the four spaces', preset: 'all', selected: 0, view: 'anterior',
    caption: 'Compare the paired lateral spaces with the two midline spaces. This sequence changes visibility and focus; it does not trace or simulate cerebrospinal-fluid flow.',
  },
];

/** Require the exact parent, four pinned space records and source bundle together. */
export function ventricularGuide(parent: BodyStructure): VentricularGuide | null {
  if (parent?.id !== ventricleCatalog.parent.id) return null;
  const matchingParents = pins.parents.filter((entry) => entry.id === parent.id);
  const pinnedParent = matchingParents[0];
  if (matchingParents.length !== 1 || canonical(parent) !== canonical(pinnedParent) ||
    canonical(parent) !== canonical(ventricleCatalog.parent)) return null;

  const bundle = ventricleCatalog.bundles.filter((entry) => entry.id === 'ventricles');
  const bindings = pins.bindings.filter((entry) => entry.study === 'ventricles' && entry.parentId === parent.id);
  const layers = ventriclesFor(parent);
  if (bundle.length !== 1 || bundle[0].sha256 !== bundleSha256 || bundle[0].structures !== 4 ||
    bindings.length !== 4 || layers.length !== 4 ||
    canonical(ventricleCatalog.ventricularIds) !== canonical(expected.map((entry) => entry.id))) return null;
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  if (byId.size !== 4 || new Set(bindings.map((entry) => entry.structure.id)).size !== 4) return null;
  if (!expected.every((entry) => {
    const layer = byId.get(entry.id);
    const binding = bindings.find((candidate) => candidate.structure.id === entry.id);
    return layer && binding && layer.fmaId === entry.fmaId && layer.laterality === entry.laterality &&
      layer.category === 'space' && layer.sourceTree === 'partof' && layer.bundle === 'ventricles' &&
      'parentId' in layer && layer.parentId === parent.id && binding.sourceHash === bundle[0].sha256 &&
      canonical(layer) === canonical(binding.structure);
  })) return null;

  const all = expected.map((entry) => entry.id);
  const lateral = all.slice(0, 2);
  const midline = all.slice(2);
  const steps: VentricularGuide['steps'] = stops.map((stop) => ({
      id: stop.id, title: stop.title, caption: stop.caption, preset: stop.preset,
      selectedId: all[stop.selected], view: stop.view,
      ids: [...(stop.preset === 'all' ? all : stop.preset === 'lateral' ? lateral : midline)],
      references: ventricularGuideReferences.map((reference) => reference.url),
    }));
  return {
    id: `ventricular-guide:${parent.id}`,
    title: 'Explore the ventricles',
    status: 'draft',
    parentId: parent.id,
    study: 'ventricles',
    transitionMs: 1800,
    continuousPlayback: guidedPlaybackEvidence(steps),
    fadeOthers: true,
    limitation: 'Draft source-space teaching only, pending revision-bound radiologist review. Interventricular foramina, cerebral aqueduct, fourth-ventricle outlets, choroid plexus and fluid flow are not segmented or simulated. No acquired-image registration, obstruction, pressure measurement or clinical diagnosis is shown.',
    steps,
  };
}
