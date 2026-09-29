import raw from '../public/models/bodyparts3d/cerebral/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { ventriclesFor, ventricleCatalog } from './ventricles.ts';
import { withHippocampi } from './hippocampi.ts';

export type CerebralStructure = BodyStructure & {
  group: string;
  sourceRelationship: 'parent-component' | 'supplemental-source';
};
const baseCerebralCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures'
> & {
  parent: BodyStructure;
  structures: CerebralStructure[];
  selectableIds: string[];
  supplementalIds: string[];
  contextIds: string[];
};
export const cerebralCatalog = withHippocampi(baseCerebralCatalog);
export function cerebralFor(parent: BodyStructure | null) {
  if (
    !ventriclesFor(parent).length ||
    JSON.stringify(cerebralCatalog.parent) !==
      JSON.stringify(ventricleCatalog.parent)
  )
    return [];
  return cerebralCatalog.structures.filter((s) =>
    cerebralCatalog.selectableIds.includes(s.id),
  );
}
export const cerebralGroups = [
  { id: 'frontal', name: 'Frontal', colour: '#c98976' },
  { id: 'parietal', name: 'Parietal', colour: '#cdad65' },
  { id: 'temporal', name: 'Temporal · partial', colour: '#76b2bd' },
  { id: 'occipital', name: 'Occipital', colour: '#9cac78' },
  { id: 'insula', name: 'Insula', colour: '#b396bd' },
  {
    id: 'superior-temporal-anterior',
    name: 'Superior temporal · anterior',
    colour: '#5e9daa',
  },
  {
    id: 'superior-temporal-posterior',
    name: 'Superior temporal · posterior',
    colour: '#8bc5cf',
  },
  { id: 'hippocampus', name: 'Hippocampus', colour: '#dfad58' },
] as const;
const notes: Record<string, string> = {
  hippocampus:
    'Original left and right hippocampal surfaces from the supplied brain, kept in their source positions. These coarse surfaces do not separately depict CA fields, dentate gyrus or subiculum and are not patient-specific segmentations. Use Hippocampi to reveal both, or Medial temporal context to retain the partial temporal regions and optional ventricular context. Anatomical and clinical validation remain pending.',
  frontal:
    'The frontal region lies anterior to the central sulcus. The source groups precentral, superior, middle and inferior frontal gyri; this is not a complete cortical parcellation or a map of motor and executive function.',
  parietal:
    'The parietal region lies posterior to the central sulcus. This source groups postcentral and angular gyri, the supramarginal gyrus and superior parietal lobule. Functional territories are not separately delineated.',
  temporal:
    'The temporal lobe lies below the lateral sulcus. This original source groups inferior and middle temporal, fusiform and parahippocampal gyri. Superior temporal subdivisions are separate additions here; the lobe remains incomplete.',
  occipital:
    'The posterior cerebral lobe is bounded medially by the parieto-occipital sulcus. This source is a single lobe surface; it does not independently mark visual cortex, calcarine sulcus or visual-field representation.',
  insula:
    'The insula lies deep within the lateral sulcus. Use the Insulae preset to remove the surrounding regions. Its surface is supplied, but individual insular gyri and functional subdivisions are not separately labelled.',
  'superior-temporal-anterior':
    'An official anterior subdivision of the superior temporal gyrus, supplied separately in the ISA archive. It was absent from the original brain aggregate. It is not a whole gyrus or a validated auditory/language territory.',
  'superior-temporal-posterior':
    'An official posterior subdivision of the superior temporal gyrus, supplied separately in the ISA archive. It was absent from the original brain aggregate. Its source boundary must not be treated as a precise functional or language-area boundary.',
};
export const cerebralNotes = Object.fromEntries(
  cerebralCatalog.structures
    .filter((s) => cerebralCatalog.selectableIds.includes(s.id))
    .map((s) => [s.fmaId, notes[s.group]]),
);
export const cerebralReferences = [
  'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p06_index.html',
  'https://nba.uth.tmc.edu/neuroanatomy/L1/Lab01p27_index.html',
];
export function cerebralPresets(layers: BodyStructure[]) {
  return {
    all: layers.map((s) => s.id),
    left: layers.filter((s) => s.laterality === 'left').map((s) => s.id),
    right: layers.filter((s) => s.laterality === 'right').map((s) => s.id),
    insula: layers
      .filter((s) => ['FMA72978', 'FMA72977'].includes(s.fmaId))
      .map((s) => s.id),
    hippocampi: layers.filter((s) => ['FMA72714', 'FMA72713'].includes(s.fmaId)).map((s) => s.id),
    'medial-temporal': layers
      .filter((s) => ['FMA72714', 'FMA72713', 'FMA72972', 'FMA72971'].includes(s.fmaId))
      .map((s) => s.id),
    temporal: layers
      .filter((s) =>
        [
          'FMA72972',
          'FMA72971',
          'FMA72801',
          'FMA72800',
          'FMA72805',
          'FMA72804',
        ].includes(s.fmaId),
      )
      .map((s) => s.id),
  };
}
