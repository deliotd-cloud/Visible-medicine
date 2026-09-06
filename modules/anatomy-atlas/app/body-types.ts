export type BodySystem =
  | 'skeleton'
  | 'muscles'
  | 'organs'
  | 'nerves'
  | 'vessels'
  | 'connective';
export type Vec3 = [number, number, number];
export type BodyStructure = {
  id: string;
  fmaId: string;
  name: string;
  sourceName: string;
  system: BodySystem;
  category: string;
  laterality: string;
  region: string;
  regions: string[];
  bundle: string;
  nodeName: string;
  bounds: { min: Vec3; max: Vec3 };
  center: Vec3;
  anchor: Vec3;
  sourceTree: string;
  sources: Array<{ file: string; sha256: string }>;
  coverageNote: string | null;
  provenance?: {
    method: 'licensed-source-mesh';
    license: string;
    sourceVersion: string;
    recovered: boolean;
  };
  validation?: { status: 'unvalidated'; anatomicalReview: false };
};
export type BodyCatalog = {
  coordinateSystem: import('../lib/anatomy-coordinates').SourceCoordinates;
  version: number;
  sourceVersion: string;
  license: string;
  credit: string;
  regions: Array<{ id: string; name: string; description: string }>;
  structures: BodyStructure[];
  bundles: Array<{
    id: string;
    url: string;
    bytes: number;
    sha256: string;
    structures: number;
  }>;
  coverage: {
    nerves: string;
    organs: string;
    vessels?: string;
    connective?: string;
  };
  excluded: Array<{ fmaId: string; name: string; reason: string }>;
};
export const bodySystems: Record<
  BodySystem,
  { name: string; color: string; description: string }
> = {
  skeleton: {
    name: 'Bones',
    color: '#c5aa79',
    description: 'Skeletal anatomy',
  },
  muscles: {
    name: 'Muscles',
    color: '#b35c50',
    description: 'Source muscle surfaces',
  },
  organs: {
    name: 'Organs',
    color: '#a27693',
    description: 'Selected internal organs',
  },
  nerves: {
    name: 'Nervous',
    color: '#d5aa3c',
    description: 'Brain & selected nerves',
  },
  vessels: {
    name: 'Vessels',
    color: '#bb4144',
    description: 'Selected arteries & veins',
  },
  connective: {
    name: 'Connective',
    color: '#77a8b6',
    description: 'Selected discs, cartilage, ligaments & tendons',
  },
};
export const allBodySystems: Record<BodySystem, boolean> = {
  skeleton: true,
  muscles: true,
  organs: true,
  nerves: true,
  vessels: true,
  connective: true,
};
