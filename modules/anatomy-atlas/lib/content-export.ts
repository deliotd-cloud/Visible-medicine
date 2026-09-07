import type { AnatomyStructure } from '../app/anatomy-data';
import type { BodyCatalog } from '../app/body-types';
import { bodyLesson } from '../app/body-content';
import { contentTabs, draftLesson, type ContentLesson } from './content-types';
import {
  REFERENCE_FRAME,
  referenceTransform,
  type SourceCoordinates,
} from './anatomy-coordinates';

export type MaterialRevisions = {
  geometry: string | null;
  teaching: string | null;
  imaging: null;
};
export type ContentBinding = {
  assetId: string;
  assetPath: string;
  assetSha256: string;
  nodeName: string;
  sourceVersion: '4.0';
  sourceTree: string;
  sources: { file: string; sha256: string; fmaId: string }[];
};
export type AnatomyContentRecord = {
  schemaVersion: 2;
  representationScope: 'shoulder-pilot' | 'body';
  id: string;
  name: string;
  latinName?: string | null;
  category: string;
  system: string;
  region: string;
  laterality: string;
  synonyms?: string[];
  externalTerminology: { fma: string[] };
  meshBindings: ContentBinding[];
  coordinateSystem: SourceCoordinates & {
    referenceFrame: typeof REFERENCE_FRAME;
  };
  content: Record<(typeof contentTabs)[number], ContentLesson>;
  provenance: {
    sourceType: 'licensed-dataset';
    sourceReference: string;
    licence: 'CC-BY-4.0';
    teachingLicence: 'MIT';
    citation: string;
    changes: string;
  };
  validation: {
    status: 'draft';
    clinicalApproval: 'not-included';
    materialRevisions: MaterialRevisions;
  };
};
export type ShoulderContentManifest = {
  version: string;
  sha256: string;
  source: string;
  license: string;
  credit: string;
  changes: string;
  coordinateSystem: SourceCoordinates;
  parts: {
    structureId: string;
    nodeName: string;
    sourceFile: string;
    sourceSha256: string;
    fmaId: string;
  }[];
};
function coordinates(source: SourceCoordinates) {
  referenceTransform(source);
  return {
    referenceFrame: REFERENCE_FRAME,
    unitsPerMillimetre: source.unitsPerMillimetre,
    sourceToSceneColumnMajor: [...source.sourceToSceneColumnMajor],
  };
}
function validation(
  revisions?: MaterialRevisions,
): AnatomyContentRecord['validation'] {
  if (revisions?.imaging !== undefined && revisions.imaging !== null)
    throw Error('This draft export contains no acquired imaging revision');
  return {
    status: 'draft',
    clinicalApproval: 'not-included',
    materialRevisions: {
      geometry: revisions?.geometry ?? null,
      teaching: revisions?.teaching ?? null,
      imaging: null,
    },
  };
}
function sourceGate(version: string, licence: string) {
  if (version !== '4.0' || licence !== 'CC-BY-4.0')
    throw Error(
      'Content export requires the audited BodyParts3D v4 source profile',
    );
}
const sourceFile = (file: string) =>
  file.endsWith('.obj') ? file : file + '.obj';

/** Pure export; no DB reads, imports, publication, approvals or display offsets. */
export function shoulderContentRecords(
  structures: AnatomyStructure[],
  manifest: ShoulderContentManifest,
  revisions: Record<string, MaterialRevisions>,
): AnatomyContentRecord[] {
  sourceGate(manifest.version, manifest.license);
  if (
    manifest.parts.some(
      (part) => !structures.some((item) => item.id === part.structureId),
    )
  )
    throw Error('Unbound shoulder source part');
  return structures.map((structure) => {
    const parts = manifest.parts.filter(
      (part) => part.structureId === structure.id,
    );
    if (!parts.length || !revisions[structure.id])
      throw Error('Missing shoulder binding/revision');
    return structuredClone({
      schemaVersion: 2,
      representationScope: 'shoulder-pilot',
      id: structure.id,
      name: structure.name,
      latinName: structure.latinName,
      category: structure.category,
      system: structure.system,
      region: structure.region,
      laterality: structure.laterality,
      synonyms: structure.synonyms,
      externalTerminology: {
        fma: [...new Set(parts.map((part) => part.fmaId))],
      },
      meshBindings: parts.map((part) => ({
        assetId: 'vm:asset:bodyparts3d:4.0:shoulder-right',
        assetPath: '/models/bodyparts3d/shoulder-right.glb',
        assetSha256: manifest.sha256,
        nodeName: part.nodeName,
        sourceVersion: '4.0',
        sourceTree: 'isa',
        sources: [
          {
            file: sourceFile(part.sourceFile),
            sha256: part.sourceSha256,
            fmaId: part.fmaId,
          },
        ],
      })),
      coordinateSystem: coordinates(manifest.coordinateSystem),
      content: Object.fromEntries(
        contentTabs.map((tab) => [tab, draftLesson(structure.sections[tab])]),
      ) as AnatomyContentRecord['content'],
      provenance: {
        sourceType: 'licensed-dataset',
        sourceReference: manifest.source,
        licence: 'CC-BY-4.0',
        teachingLicence: 'MIT',
        citation: manifest.credit,
        changes: manifest.changes,
      },
      validation: validation(revisions[structure.id]),
    } satisfies AnatomyContentRecord);
  });
}

export function bodyContentRecords(
  catalog: BodyCatalog,
): AnatomyContentRecord[] {
  sourceGate(catalog.sourceVersion, catalog.license);
  return catalog.structures.map((structure) => {
    const bundle = catalog.bundles.find((item) => item.id === structure.bundle);
    if (!bundle) throw Error('Missing body asset binding');
    return structuredClone({
      schemaVersion: 2,
      representationScope: 'body',
      id: structure.id,
      name: structure.name,
      category: structure.category,
      system: structure.system,
      region: structure.region,
      laterality: structure.laterality,
      externalTerminology: { fma: [structure.fmaId] },
      meshBindings: [
        {
          assetId: 'vm:asset:bodyparts3d:4.0:' + bundle.id,
          assetPath: bundle.url,
          assetSha256: bundle.sha256,
          nodeName: structure.nodeName,
          sourceVersion: '4.0',
          sourceTree: structure.sourceTree,
          sources: structure.sources.map((source) => ({
            file: sourceFile(source.file),
            sha256: source.sha256,
            fmaId: structure.fmaId,
          })),
        },
      ],
      coordinateSystem: coordinates(catalog.coordinateSystem),
      content: Object.fromEntries(
        contentTabs.map((tab) => [tab, bodyLesson(structure, tab)]),
      ) as AnatomyContentRecord['content'],
      provenance: {
        sourceType: 'licensed-dataset',
        sourceReference:
          'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
        licence: 'CC-BY-4.0',
        teachingLicence: 'MIT',
        citation: catalog.credit,
        changes:
          'Selected v4 source components; shared source-to-scene transform; GLB conversion; source-derived display and teaching adaptations. See bundled source notices and catalogue exclusions.',
      },
      // Body representation revisions are not the separate shoulder pilot's reviews,
      // even when a stable anatomy ID happens to be shared between those scopes.
      validation: validation(),
    } satisfies AnatomyContentRecord);
  });
}
