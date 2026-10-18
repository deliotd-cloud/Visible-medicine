import raw from '../public/models/bodyparts3d/cardiac/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';

export const cardiacCatalog = raw as unknown as BodyCatalog & {
  parent: BodyStructure;
  selectableIds: string[];
  contextIds: string[];
};
export function cardiacFor(parent: BodyStructure | null) {
  const binding = cardiacCatalog.parent;
  if (
    !parent ||
    parent.id !== binding.id ||
    parent.fmaId !== binding.fmaId ||
    parent.name !== binding.name ||
    parent.sourceTree !== binding.sourceTree ||
    parent.system !== binding.system ||
    parent.category !== binding.category ||
    parent.laterality !== binding.laterality ||
    parent.region !== binding.region ||
    parent.regions.join('|') !== binding.regions.join('|') ||
    parent.bundle !== binding.bundle ||
    parent.nodeName !== binding.nodeName ||
    parent.sources.length !== binding.sources.length ||
    new Set(parent.sources.map((s) => s.file)).size !== parent.sources.length ||
    !binding.sources.every((s) =>
      parent.sources.some((p) => p.file === s.file && p.sha256 === s.sha256),
    )
  )
    return [];
  return cardiacCatalog.structures.filter((s) =>
    cardiacCatalog.selectableIds.includes(s.id),
  );
}
export const cardiacReference =
  'https://www.vhlab.umn.edu/atlas/physiology-tutorial/the-human-heart.shtml';
export const cardiacNotes: Record<string, string> = {
  FMA11359:
    'The right atrium receives systemic venous blood. This shape represents its cavity, not the chamber wall; blood passes through the tricuspid valve towards the right ventricle.',
  FMA9465:
    'The left atrium receives pulmonary venous blood. This cavity shape can be compared with the left ventricle; the intervening mitral valve is not displayed here.',
  FMA9291:
    'The right ventricle pumps blood towards the pulmonary circulation. This is a cavity representation, not myocardium or a measured end-diastolic volume.',
  FMA9466:
    'The left ventricle pumps blood into the aorta. The cavity shape does not depict wall thickness, contraction, valve movement or a specific cardiac phase.',
};
export function cardiacPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    right: layers.filter((s) => s.laterality === 'right').map((s) => s.id),
    left: layers.filter((s) => s.laterality === 'left').map((s) => s.id),
    atria: layers
      .filter((s) => ['FMA11359', 'FMA9465'].includes(s.fmaId))
      .map((s) => s.id),
    ventricles: layers
      .filter((s) => ['FMA9291', 'FMA9466'].includes(s.fmaId))
      .map((s) => s.id),
  };
}
