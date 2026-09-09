import raw from '../public/models/bodyparts3d/eye-layers/catalog.json';
import type { BodyCatalog, BodyStructure } from '../app/body-types';
export type EyeKind =
  | 'cornea'
  | 'iris'
  | 'lens'
  | 'zonule'
  | 'vitreous'
  | 'choroid'
  | 'sclera'
  | 'chamber';
export type EyeLayer = BodyStructure & { parentId: string; kind: EyeKind };
export const eyeCatalog = raw as unknown as Omit<
  BodyCatalog,
  'structures' | 'excluded'
> & {
  parents: Array<{
    id: string;
    fmaId: string;
    laterality: string;
    sources: BodyStructure['sources'];
  }>;
  structures: EyeLayer[];
  sourceCleanup: Array<{ file: string; count: number }>;
  excluded: Array<{
    fmaId: string;
    name: string;
    parentId: string;
    kind: EyeKind;
    reason: string;
  }>;
};
export function eyeLayersFor(parent: BodyStructure | null) {
  if (!parent) return [];
  const binding = eyeCatalog.parents.find(
    (p) =>
      p.id === parent.id &&
      p.fmaId === parent.fmaId &&
      p.laterality === parent.laterality,
  );
  if (
    !binding ||
    parent.sourceTree !== 'partof' ||
    binding.sources.length !== parent.sources.length ||
    !binding.sources.every((f) =>
      parent.sources.some((p) => p.file === f.file && p.sha256 === f.sha256),
    )
  )
    return [];
  return eyeCatalog.structures.filter((s) => s.parentId === parent.id);
}
export const eyeNotes: Record<
  EyeKind,
  {
    label: string;
    color: string;
    opacity: number;
    anatomy: string;
    function: string;
  }
> = {
  cornea: {
    label: 'Cornea',
    color: '#83c9d8',
    opacity: 0.32,
    anatomy:
      'Transparent anterior surface, continuous with the sclera at the limbus.',
    function: 'Refracts incoming light and forms a protective front surface.',
  },
  iris: {
    label: 'Iris',
    color: '#7b9662',
    opacity: 1,
    anatomy: 'Pigmented diaphragm anterior to the lens, surrounding the pupil.',
    function: 'Changes pupil size to regulate light entry.',
  },
  lens: {
    label: 'Lens',
    color: '#a9d8dd',
    opacity: 0.7,
    anatomy:
      'Transparent structure behind the iris, supported by the zonular fibres.',
    function:
      'Helps focus light on the retina; its shape changes during accommodation.',
  },
  zonule: {
    label: 'Lens support',
    color: '#d8c9a1',
    opacity: 1,
    anatomy:
      'Source-labelled suspensory ligament of the lens; this is not individual validated zonular-fibre segmentation.',
    function: 'Transmits tension between the ciliary region and lens.',
  },
  vitreous: {
    label: 'Vitreous body',
    color: '#8fbdd5',
    opacity: 0.12,
    anatomy:
      'Gel-filled compartment behind the lens and in front of the retina.',
    function:
      'Occupies the posterior cavity and provides a transparent optical medium.',
  },
  choroid: {
    label: 'Choroid',
    color: '#a45d58',
    opacity: 0.8,
    anatomy:
      'Vascular coat between sclera and retina. The source groups two files as one named structure.',
    function: 'Supports the outer retina through its vascular supply.',
  },
  sclera: {
    label: 'Sclera',
    color: '#e5ddd0',
    opacity: 1,
    anatomy:
      'Fibrous outer coat of the globe, continuous anteriorly with the cornea.',
    function: 'Provides mechanical protection and support.',
  },
  chamber: {
    label: 'Anterior chamber',
    color: '#9bd3cb',
    opacity: 0.12,
    anatomy:
      'Space between the cornea and iris. Only the left source representation is included.',
    function:
      'Contains aqueous humour; this surface does not simulate its production or drainage.',
  },
};
export type EyePreset = 'all' | 'anterior' | 'lens' | 'wall';
export function eyePresetHidden(layers: EyeLayer[], preset: EyePreset) {
  const visible: Record<EyePreset, EyeKind[]> = {
    all: [
      'cornea',
      'iris',
      'lens',
      'zonule',
      'vitreous',
      'choroid',
      'sclera',
      'chamber',
    ],
    anterior: ['cornea', 'iris', 'lens', 'zonule'],
    lens: ['lens', 'zonule'],
    wall: ['sclera', 'choroid'],
  };
  return layers
    .filter((s) => !visible[preset].includes(s.kind))
    .map((s) => s.id);
}
export const eyeReferences = [
  {
    label: 'National Eye Institute',
    url: 'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work',
  },
  {
    label: 'Anatomy of the Eye',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK11120/',
  },
];
