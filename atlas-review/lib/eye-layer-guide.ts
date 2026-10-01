import pins from '../content/nested-teaching-bindings.v1.json' with { type: 'json' };
import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import {
  eyeCatalog,
  eyeLayersFor,
  eyePresetHidden,
  eyeReferences,
  type EyeKind,
  type EyePreset,
} from './eye-layers';

export type EyeLayerGuide = {
  id: string;
  title: string;
  status: 'draft';
  parentId: string;
  study: 'eye';
  limitation: string;
  transitionMs: 1800;
  fadeOthers: true;
  steps: Array<{
    id: string;
    title: string;
    caption: string;
    preset: EyePreset;
    selectedId: string;
    view: DissectionView;
    ids: string[];
    references: string[];
  }>;
};

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
  preset: EyePreset;
  selected: EyeKind;
  view: DissectionView;
  required: EyeKind[];
}> = [
  {
    id: 'anterior', title: 'Cornea and iris', preset: 'anterior',
    selected: 'cornea', view: 'anterior', required: ['cornea', 'iris'],
    caption: 'The cornea forms the transparent front surface. Behind it, the iris surrounds the pupil and regulates light entry.',
  },
  {
    id: 'lens', title: 'Lens and support', preset: 'lens',
    selected: 'lens', view: 'left', required: ['lens', 'zonule'],
    caption: 'The lens sits behind the iris. Its source-labelled suspensory support is grouped here, not segmented into individual zonular fibres.',
  },
  {
    id: 'vitreous', title: 'Vitreous in context', preset: 'all',
    selected: 'vitreous', view: 'posterior', required: ['vitreous'],
    caption: 'The vitreous occupies the posterior cavity behind the lens and in front of the retina; the retina itself is not a selectable layer here.',
  },
  {
    id: 'wall', title: 'Wall layers', preset: 'wall',
    selected: 'sclera', view: 'posterior', required: ['sclera', 'choroid'],
    caption: 'The sclera is the outer coat. The choroid lies between sclera and retina; its source representation groups two files as one named structure.',
  },
];

/** A complete, pinned side is required; an absent or changed component never yields a partial tour. */
export function eyeLayerGuide(parent: BodyStructure): EyeLayerGuide | null {
  const pinnedParent = pins.parents.find((p) => p.id === parent?.id);
  if (!pinnedParent || canonical(parent) !== canonical(pinnedParent)) return null;

  const layers = eyeLayersFor(parent);
  const bindings = pins.bindings.filter((b) => b.study === 'eye' && b.parentId === parent.id);
  const bundleHash = eyeCatalog.bundles.find((b) => b.id === 'eye-layers')?.sha256;
  if (!bundleHash || !layers.length || layers.length !== bindings.length) return null;
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  const byKind = new Map(layers.map((layer) => [layer.kind, layer]));
  if (byId.size !== layers.length || byKind.size !== layers.length) return null;
  if (!bindings.every((binding) => {
    const layer = byId.get(binding.structure.id);
    return layer && layer.parentId === parent.id &&
      layer.bundle === 'eye-layers' && binding.sourceHash === bundleHash &&
      canonical(layer) === canonical(binding.structure);
  })) return null;
  if (!stops.every((stop) => stop.required.every((kind) => byKind.has(kind)))) return null;

  return {
    id: `eye-layer-guide:${parent.id}`,
    title: 'Explore eye layers',
    status: 'draft',
    parentId: parent.id,
    study: 'eye',
    limitation: 'Draft source-component teaching only; not clinical approval or scan registration. Retina and finer layers are not segmented. The cleaned right eye retains only available source components, with no right anterior-chamber substitute. Visibility is not surgical planes or an optical simulation.',
    transitionMs: 1800,
    fadeOthers: true,
    steps: stops.map((stop) => {
      const hidden = new Set(eyePresetHidden(layers, stop.preset));
      const ids = layers.filter((layer) => !hidden.has(layer.id)).map((layer) => layer.id);
      const selectedId = byKind.get(stop.selected)!.id;
      return {
        id: stop.id,
        title: stop.title,
        caption: stop.caption,
        preset: stop.preset,
        selectedId,
        view: stop.view,
        ids,
        references: eyeReferences.map((reference) => reference.url),
      };
    }),
  };
}
