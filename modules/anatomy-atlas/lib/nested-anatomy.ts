import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { eyeCatalog, eyeLayersFor } from './eye-layers.ts';
import { ventricleCatalog, ventriclesFor } from './ventricles.ts';
import { brainstemCatalog, brainstemFor } from './brainstem.ts';
import { cerebralCatalog, cerebralFor } from './cerebral.ts';
import { cardiacCatalog, cardiacFor } from './cardiac.ts';
import { pulmonaryCatalog, pulmonaryFor } from './pulmonary.ts';
import { hepaticCatalog, hepaticFor } from './hepatic.ts';

export type NestedStudy =
  | 'eye'
  | 'ventricles'
  | 'brainstem'
  | 'cerebral'
  | 'cardiac'
  | 'pulmonary'
  | 'hepatic';
export type NestedSelection = {
  study: NestedStudy;
  structureId: string;
  sourceHash: string;
};
export type NestedTarget = NestedSelection & {
  parentId: string;
  parentHash: string;
  structure: BodyStructure;
  title: string;
};
export type NestedRequest = NestedSelection & {
  parentId: string;
  parentHash: string;
};
const studies = [
  {
    study: 'hepatic',
    title: 'Liver internal branches',
    catalog: hepaticCatalog,
    layers: hepaticFor,
  },
  {
    study: 'pulmonary',
    title: 'Lung branch groups',
    catalog: pulmonaryCatalog,
    layers: pulmonaryFor,
  },
  {
    study: 'cardiac',
    title: 'Cardiac chamber spaces',
    catalog: cardiacCatalog,
    layers: cardiacFor,
  },
  {
    study: 'eye',
    title: 'Eye layers',
    catalog: eyeCatalog,
    layers: eyeLayersFor,
  },
  {
    study: 'ventricles',
    title: 'Ventricular spaces',
    catalog: ventricleCatalog,
    layers: ventriclesFor,
  },
  {
    study: 'brainstem',
    title: 'Brainstem and cerebellum',
    catalog: brainstemCatalog,
    layers: brainstemFor,
  },
  {
    study: 'cerebral',
    title: 'Cerebral regions',
    catalog: cerebralCatalog,
    layers: cerebralFor,
  },
] as const;

export function nestedPartsFor(parent: BodyStructure, study: NestedStudy) {
  return studies.find((entry) => entry.study === study)?.layers(parent) ?? [];
}
export function nestedBundleHash(study: NestedStudy, bundle: string) {
  return (
    studies
      .find((entry) => entry.study === study)
      ?.catalog.bundles.find((entry) => entry.id === bundle)?.sha256 ?? null
  );
}

/** Navigation-only bindings. Context meshes, exclusions and unsupported parents
 * never become selectable children or imaging/lecture entitlements. */
export function nestedStudyTargets(catalog: BodyCatalog): NestedTarget[] {
  return catalog.structures.flatMap((parent) => {
    const parentBundle = catalog.bundles.find((b) => b.id === parent.bundle);
    if (!parentBundle) return [];
    return studies.flatMap((entry) =>
      entry.layers(parent).flatMap((structure) => {
        const bundle = entry.catalog.bundles.find(
          (b) => b.id === structure.bundle,
        );
        if (!bundle) return [];
        return [
          {
            parentId: parent.id,
            parentHash: parentBundle.sha256,
            study: entry.study,
            title: entry.title,
            structure,
            structureId: structure.id,
            sourceHash: bundle.sha256,
          },
        ];
      }),
    );
  });
}

export function nestedSideMatches(structure: BodyStructure, side: string) {
  return (
    ['both', 'left', 'right'].includes(side) &&
    (side === 'both' ||
      structure.laterality === side ||
      ['midline', 'unpaired', 'unspecified'].includes(structure.laterality))
  );
}

/** Resolve fresh canonical data; never trust a cached search result or URL. */
export function resolveNestedTarget(
  catalog: BodyCatalog,
  parentId: string,
  selection: NestedSelection,
  side: string,
): NestedTarget | null {
  return (
    nestedStudyTargets(catalog).find(
      (target) =>
        target.parentId === parentId &&
        target.study === selection.study &&
        target.structureId === selection.structureId &&
        target.sourceHash === selection.sourceHash &&
        nestedSideMatches(target.structure, side),
    ) ?? null
  );
}
