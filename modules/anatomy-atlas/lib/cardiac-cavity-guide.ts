import pins from '../content/nested-teaching-bindings.v1.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { cardiacCatalog, cardiacFor } from './cardiac';

export const cardiacCavityGuideReferences = [
  { title: 'NHLBI · How blood flows through the heart', url: 'https://www.nhlbi.nih.gov/health/heart/blood-flow' },
  { title: 'University of Minnesota · The human heart', url: 'https://www.vhlab.umn.edu/atlas/physiology-tutorial/the-human-heart.shtml' },
] as const;

export type CardiacCavityGuide = {
  id: string; title: string; status: 'draft'; parentId: string; study: 'cardiac';
  transitionMs: 1800; fadeOthers: true; limitation: string;
  steps: Array<{
    id: string; title: string; caption: string; preset: 'all' | 'right' | 'left';
    selectedId: string; view: DissectionView; ids: string[]; references: string[];
  }>;
};

const expected = [
  { id: 'vm:anatomy:body:thorax:right:organ:cavity-of-right-atrium', fmaId: 'FMA11359', laterality: 'right' },
  { id: 'vm:anatomy:body:thorax:left:organ:cavity-of-left-atrium', fmaId: 'FMA9465', laterality: 'left' },
  { id: 'vm:anatomy:body:thorax:right:organ:cavity-of-right-ventricle', fmaId: 'FMA9291', laterality: 'right' },
  { id: 'vm:anatomy:body:thorax:left:organ:cavity-of-left-ventricle', fmaId: 'FMA9466', laterality: 'left' },
] as const;
const bundleSha256 = '64d93898db3b6cb4dbea452508799c98cbe65b361eba2f17658ecae532a01f67';
const expectedBundle = {
  id: 'cardiac', url: `/models/bodyparts3d/cardiac/cardiac.glb?v=${bundleSha256}`,
  bytes: 587588, sha256: bundleSha256, structures: 6,
};
const canonical = (v: unknown): string => Array.isArray(v) ? `[${v.map(canonical).join(',')}]` :
  v && typeof v === 'object' ? `{${Object.keys(v).sort().map(k =>
    `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(v);

const stops: Array<{
  id: string; title: string; caption: string;
  preset: CardiacCavityGuide['steps'][number]['preset']; selected: number; view: DissectionView;
}> = [
  { id: 'overview', title: 'Four heart chamber spaces', preset: 'all', selected: 0, view: 'anterior',
    caption: 'Compare four source-labelled cavities: two atria and two ventricles. These surfaces represent chamber spaces, not muscular walls or a particular phase of the heartbeat.' },
  { id: 'right-atrium', title: 'Right atrium: systemic venous return', preset: 'right', selected: 0, view: 'right',
    caption: 'The right atrium normally receives systemic venous blood through the venae cavae. Compare it with the right ventricle; the venous openings and tricuspid leaflets are not separate selections.' },
  { id: 'right-ventricle', title: 'Right ventricle: pulmonary pump', preset: 'right', selected: 2, view: 'anterior',
    caption: 'Blood normally passes from the right atrium through the tricuspid valve into the right ventricle, then towards the pulmonary artery. This cavity view does not display valve motion or trace that route.' },
  { id: 'left-atrium', title: 'Left atrium: pulmonary venous return', preset: 'left', selected: 1, view: 'posterior',
    caption: 'Pulmonary venous blood normally returns to the left atrium before passing through the mitral valve into the left ventricle. The posterior view changes perspective, not the specimen or its anatomy.' },
  { id: 'left-ventricle', title: 'Left ventricle: systemic pump', preset: 'left', selected: 3, view: 'left',
    caption: 'The left ventricle normally ejects blood through the aortic valve into the aorta. A cavity surface cannot show myocardial thickness, contraction, pressure or an ejection fraction.' },
  { id: 'return-overview', title: 'Compare the four cavities again', preset: 'all', selected: 0, view: 'anterior',
    caption: 'Compare the right and left cavity pairs in the same source frame. This walkthrough changes visibility and camera direction; it neither joins vessel lumens nor simulates blood flow.' },
];

/** No partial or repaired guide: require the exact parent and all four pinned cavities. */
export function cardiacCavityGuide(parent: BodyStructure): CardiacCavityGuide | null {
  if (parent?.id !== cardiacCatalog.parent.id) return null;
  const parents = pins.parents.filter(p => p.id === parent.id);
  if (parents.length !== 1 || canonical(parent) !== canonical(parents[0]) ||
    canonical(parent) !== canonical(cardiacCatalog.parent)) return null;
  const bundles = cardiacCatalog.bundles.filter(b => b.id === 'cardiac');
  const bindings = pins.bindings.filter(b => b.study === 'cardiac' && b.parentId === parent.id);
  const layers = cardiacFor(parent);
  if (bundles.length !== 1 || canonical(bundles[0]) !== canonical(expectedBundle) ||
    bindings.length !== 4 || layers.length !== 4 ||
    canonical(cardiacCatalog.selectableIds) !== canonical(expected.map(e => e.id))) return null;
  const byId = new Map(layers.map(s => [s.id, s]));
  if (byId.size !== 4 || new Set(bindings.map(b => b.structure.id)).size !== 4) return null;
  if (!expected.every(e => {
    const s = byId.get(e.id), b = bindings.find(b => b.structure.id === e.id);
    return s && b && s.fmaId === e.fmaId && s.laterality === e.laterality &&
      s.category === 'organ' && s.sourceTree === 'partof' && s.bundle === 'cardiac' &&
      'parentId' in s && s.parentId === parent.id && b.sourceHash === bundleSha256 &&
      canonical(s) === canonical(b.structure);
  })) return null;
  const all = expected.map(e => e.id);
  return {
    id: `cardiac-cavity-guide:${parent.id}`, title: 'Explore the heart chamber spaces',
    status: 'draft', parentId: parent.id, study: 'cardiac', transitionMs: 1800, fadeOthers: true,
    limitation: 'Draft cavity-space teaching pending revision-bound radiologist review. Myocardium, septa, valves, vessel openings and conduction tissue are not separately resolved here. Static shapes do not establish a cardiac phase, chamber volume, pressure, ejection fraction or blood flow. No acquired-image registration or clinical diagnosis is shown.',
    steps: stops.map(s => ({ id: s.id, title: s.title, caption: s.caption, preset: s.preset,
      selectedId: all[s.selected], view: s.view,
      ids: expected.filter(e => s.preset === 'all' || e.laterality === s.preset).map(e => e.id),
      references: cardiacCavityGuideReferences.map(r => r.url) })),
  };
}
