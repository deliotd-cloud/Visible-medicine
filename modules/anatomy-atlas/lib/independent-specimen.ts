import type { BodyCatalog, BodyStructure, Vec3 } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { initialVentricles, reduceVentricles, type VentricularAction, type VentricularState } from './ventricles';
export type SpecimenSurface = {
  id: string; slug: string; name: string; sourceName: string; fmaId: null;
  tissue: string; laterality: string; bundle: string; nodeName: string;
  bounds: { min: number[]; max: number[] }; center: number[]; anchor: number[];
  sources: Array<{ file: string; sha256: string }>; triangles: number;
  omittedSourceFaces: number[]; grouped?: boolean; coverageNote?: string | null;
  sourceQuality?: { components: number; nonManifoldEdges: number; zeroNormalVertices: number };
};
export type SpecimenStudy = { id: string; title: string; ids: string[]; selectedId: string; view: DissectionView; note: string };
export type SpecimenDefinition = {
  key: string; label: string; source: { credit: string; license: string; version: string };
  surfaces: SpecimenSurface[]; catalog: BodyCatalog; studies: SpecimenStudy[];
  initialStudy: string; closeUp: { min: Vec3; max: Vec3 } | null;
  omittedFaces: number; limitations: string;
};
export function specimenCatalog({ key, source, surfaces, bundles, matrix }: {
  key: string; source: SpecimenDefinition['source']; surfaces: SpecimenSurface[];
  bundles: BodyCatalog['bundles']; matrix: number[];
}): BodyCatalog {
  return {
    version: 1, sourceVersion: key, license: source.license, credit: source.credit,
    coordinateSystem: { sourceToSceneColumnMajor: matrix, unitsPerMillimetre: .01 },
    structures: surfaces.map((s): BodyStructure => ({ ...s, fmaId: '',
      system: s.tissue === 'skeleton' ? 'skeleton' : s.tissue === 'muscle' ? 'muscles' : 'connective',
      category: s.tissue, region: 'independent-limb', regions: ['independent-limb'],
      bounds: s.bounds as BodyStructure['bounds'], center: s.center as Vec3, anchor: s.anchor as Vec3,
      sourceTree: key, coverageNote: s.coverageNote ?? 'Independent source specimen; clinical review pending.',
      provenance: { method: 'licensed-source-mesh', license: source.license, sourceVersion: source.version, recovered: false },
      validation: { status: 'unvalidated', anatomicalReview: false },
    })),
    bundles: bundles.filter((b) => surfaces.some((s) => s.bundle === b.id)),
    regions: [], excluded: [], coverage: { nerves: 'Not supplied', organs: 'Not applicable' },
  };
}
export type SpecimenAction = VentricularAction | { type: 'group'; tissue: string; visible: boolean };
export function specimenAction(specimen: SpecimenDefinition, value: string): VentricularAction | null {
  const study = specimen.studies.find((s) => s.id === value);
  return study ? { type: 'preset', value, selectedId: study.selectedId } : null;
}
export function reduceSpecimen(specimen: SpecimenDefinition, state: VentricularState, action: SpecimenAction) {
  const structures = specimen.catalog.structures;
  if (action.type !== 'group') return reduceVentricles(structures, state, action, Object.fromEntries(specimen.studies.map((s) => [s.id, s.ids])));
  const members = new Set(specimen.surfaces.filter((s) => s.tissue === action.tissue).map((s) => s.id));
  if (!members.size) return state;
  const ids = structures.filter((s) => members.has(s.id) ? action.visible : !state.hidden.includes(s.id)).map((s) => s.id);
  const selectedId = state.selectedId && ids.includes(state.selectedId) ? state.selectedId : ids[0];
  return reduceVentricles(structures, state, { type: 'preset', value: 'group', ...(selectedId ? { selectedId } : {}) }, { group: ids });
}
export function initialSpecimen(specimen: SpecimenDefinition) {
  const base = initialVentricles(specimen.catalog.structures), action = specimenAction(specimen, specimen.initialStudy);
  const initial = action ? reduceSpecimen(specimen, base, action) : base;
  return { ...initial, history: [], future: [] };
}
export function activeSpecimenStudy(specimen: SpecimenDefinition, hidden: string[]) {
  return specimen.studies.find((s) => specimen.surfaces.every((item) => hidden.includes(item.id) === !s.ids.includes(item.id)));
}
export const filterSpecimen = (specimen: SpecimenDefinition, query: string) => specimen.surfaces.filter((s) => `${s.name} ${s.slug} ${s.tissue}`.toLowerCase().includes(query.trim().toLowerCase()));
