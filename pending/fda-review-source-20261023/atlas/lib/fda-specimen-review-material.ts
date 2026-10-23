import catalogueJson from '../public/models/fda-shoulder-draft/catalog.json';
import renderer from '../content/body-renderer-revision.json';
import fdaRenderer from '../content/fda-reference-renderer-revision.json';
import { assertPinnedFdaCatalogue, fdaReferenceCatalogueSha256, fdaShoulderSpecimenId } from './fda-shoulder-reference';
import { canonicalSpecimenValue, specimenTopics } from './specimen-links';
import { specimenChecklists, specimenReviewScope, type SpecimenReviewContext } from './specimen-review';
import type { SpecimenLesson } from '../content/um-limb-teaching';
import type { SpecimenGuidedDissection } from './specimen-guided-dissection';

const sourceFrame = 'fda-shoulder-fc9f3e56:unitless-normalized-source-assembly';
const checklistVersion = 'fda-unitless-specimen-review-1';
const catalogue = catalogueJson;

export const fdaSpecimenReviewRows = [{
  key: fdaShoulderSpecimenId,
  name: 'FDA shoulder · independent unitless draft',
  surfaces: catalogue.structures.map(s => ({ id: s.id, name: s.name, laterality: 'unverified' })),
}];

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalSpecimenValue(JSON.parse(JSON.stringify(value))));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function assertRendererPin(): Promise<void> {
  const sha = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) && !/^0+$/.test(value);
  if (fdaRenderer.schema !== 'vm-fda-reference-renderer/1' || !sha(fdaRenderer.sha256) ||
      !Array.isArray(fdaRenderer.inputs) || !fdaRenderer.inputs.length ||
      fdaRenderer.inputs.some(input => !input || typeof input.path !== 'string' || !input.path || !sha(input.sha256)) ||
      !sha(renderer.sha256)) throw new Error('FDA Review renderer binding is unavailable');
  const bytes = new TextEncoder().encode(JSON.stringify(fdaRenderer.inputs));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const actual = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual !== fdaRenderer.sha256) throw new Error('FDA Review renderer pin does not match its inputs');
}

/** Independent source worksheet. This material does not grant an approval. */
export async function fdaSpecimenReviewMaterial(specimenKey: string, structureId: string) {
  if (specimenKey !== fdaShoulderSpecimenId) return null;
  const structure = catalogue.structures.find(s => s.id === structureId);
  if (!structure) return null; // Includes held Gcart and foreign source IDs.
  await assertPinnedFdaCatalogue(catalogue);
  await assertRendererPin();

  const identity = {
    catalogScope: specimenReviewScope,
    specimenKey,
    sourceFrame,
    structureId,
    checklistVersion,
  };
  const source = {
    specimenKey,
    sourceFrame,
    structure: { ...structure, sourceName: structure.sourcePart },
    catalogue,
    studies: [],
    limitations: 'Independent, unitless source assembly. Physical units, anatomical axes, bone extent, attachments, intersections and clinical fidelity are unvalidated. Constructed glenoid cartilage remains held.',
  };
  const teaching = {
    topics: specimenTopics.map(tab => ({ tab, body: null as string | null, references: [] as string[] })),
    lesson: null as SpecimenLesson | null,
    referenceTitles: { [catalogue.source.publicationURL]: 'OSEL-DAM / FDA shoulder model publication' },
    motorSupplies: undefined,
    guidedDissection: null as SpecimenGuidedDissection | null,
  };
  const atlasPath = '/specimens/fda-shoulder';
  const atlasLink = `${atlasPath}?referenceRevision=${fdaReferenceCatalogueSha256}&structure=${encodeURIComponent(structureId)}`;
  const checklists = structuredClone(specimenChecklists);
  checklists.geometry = [
    { id: 'identity', label: 'Confirm the exact FDA source part and publisher provenance. Anatomical side remains unverified.' },
    { id: 'shape', label: 'Inspect source-part extent and shape in the unitless viewer; record uncertain boundaries.' },
    { id: 'relations', label: 'Inspect neighbouring parts, attachments and intersections. Preserve the held Gcart exclusion.' },
    { id: 'display', label: 'Inspect labels, selection, rotation and display fidelity without inferring anatomical axes or physical measurements.' },
    { id: 'scope', label: 'Record draft educational scope and corrections. This does not validate clinical anatomy.' },
  ];
  const sourceHash = await digest(source);
  const teachingHash = await digest(teaching);
  const rendererHash = await digest({ fdaReferenceRenderer: fdaRenderer.sha256, bodyRenderer: renderer.sha256 });
  const materialHash = await digest({ identity, sourceHash, teachingHash, rendererHash, checklists });
  const context: SpecimenReviewContext = {
    ...identity,
    structureName: structure.name,
    materialHash,
    sourceHash,
    teachingHash,
    rendererHash,
    teachingTabs: [],
    checklists,
    blockers: {
      geometry: [
        'Approval blocked: physical units and anatomical axes are unvalidated.',
        'Approval blocked: bone extent, attachments, intersections and clinical fidelity are unvalidated.',
        'Constructed glenoid cartilage (Gcart) remains held for source topology defects.',
      ],
      teaching: ['No authored teaching topics, lesson, self-check or guided dissection are available for this source.'],
      imaging: ['No validated acquired-image series or spatial registration is connected. Imaging approval is unavailable.'],
    },
    revisions: {
      geometry: await digest({ identity, sourceHash, rendererHash, checklist: checklists.geometry }),
      teaching: null,
      imaging: null,
    },
  };
  return structuredClone({ context, source, teaching, atlasPath, atlasLink });
}

export type FdaSpecimenReviewMaterial = NonNullable<Awaited<ReturnType<typeof fdaSpecimenReviewMaterial>>>;
