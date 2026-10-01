import { hraRenalDefinition } from "./hra-renal";
import { hraRenalTeaching } from "./hra-renal-teaching";
import { hraPelvisDefinition } from "./hra-pelvis";
import { hraPelvicGuidedDissection } from './hra-pelvic-guided-dissection';
import { abdominalGuidedDissection } from './abdominal-guided-dissection';
import { backGuidedDissection } from './back-guided-dissection';
import type { SpecimenGuidedDissection } from './specimen-guided-dissection';
import { hraPelvicTeaching, hraPelvicContextReferenceTitles } from "./hra-pelvis-teaching";
import renal from "../public/models/hra-renal/catalog.json";
import pelvis from "../public/models/hra-pelvis/catalog.json";
import renderer from "../content/body-renderer-revision.json";
import { hraRenalReferenceTitles } from "../content/hra-renal-teaching";
import { specimenTopics } from "./specimen-links";
import { canonicalSpecimenValue } from "./specimen-links";
import { makeIndependentStudyLink, independentStudyRoutes } from './independent-study-links';
import { makeSpecimenLink } from './um-limb-navigation';
import { limbDefinitions } from './um-limb-studies';
import { specimenTeachingFor } from './um-limb-teaching';
import { abdominalWallDefinition } from './abdominal-wall';
import { abdominalTeachingFor } from './abdominal-wall-teaching';
import { abdominalReferenceTitles } from '../content/abdominal-wall-teaching';
import { backLayersDefinition } from './back-layers';
import { backLayersTeachingFor } from './back-layers-teaching';
import { backLayersReferences } from '../content/back-layers-teaching';
import abdominal from '../public/models/bodyparts3d-v3/abdominal-wall/catalog.json';
import back from '../public/models/bodyparts3d-v3/back-layers/catalog.json';
import limb from '../public/models/um-limb/catalog.json';
import knee from '../public/models/um-knee/catalog.json';
import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';
import type { SpecimenLesson } from '../content/um-limb-teaching';
import { motorNerves } from '../content/um-limb-motor';
import {
  specimenChecklists,
  specimenChecklistVersion,
  specimenReviewScope,
  type SpecimenReviewContext,
} from "./specimen-review";

// Explicit source adapters only. More donors require their own admitted source,
// frame and teaching adapter, not inferred identity matches or migrated approvals.
type ReviewCatalogue = { source: { credit: string; license: string }; sourceFrame: string; [key: string]: unknown };
type Adapter = { definition: SpecimenDefinition; raw: ReviewCatalogue; lesson: (d:SpecimenDefinition,s:SpecimenSurface)=>SpecimenLesson|null; titles: Readonly<Record<string,string>>; path:string; limb?:boolean; guide?: (definition: SpecimenDefinition) => SpecimenGuidedDissection | null };
const registry: Adapter[] = [
  {
    definition: hraRenalDefinition,
    raw: renal,
    lesson: hraRenalTeaching,
    titles: hraRenalReferenceTitles,
    path: "/specimens/kidneys",
  },
  {
    definition: hraPelvisDefinition,
    guide: hraPelvicGuidedDissection,
    raw: { ...pelvis, companionRenal: renal },
    lesson: hraPelvicTeaching,
    titles: hraPelvicContextReferenceTitles,
    path: "/specimens/female-pelvis",
  },
  { definition:abdominalWallDefinition, raw:{...abdominal,sourceFrame:independentStudyRoutes.find(r=>r.key===abdominal.specimenId)!.frame},
    guide: abdominalGuidedDissection,
    lesson:abdominalTeachingFor, titles:abdominalReferenceTitles, path:'/specimens/abdominal-wall' },
  { definition:backLayersDefinition, raw:{...back,sourceFrame:independentStudyRoutes.find(r=>r.key===back.specimenId)!.frame},
    guide: backGuidedDissection,
    lesson:backLayersTeachingFor, titles:backLayersReferences, path:'/specimens/back-layers' },
  ...Object.values(limbDefinitions).map((definition):Adapter=>({ definition,
    raw:{...limb,companionKnee:knee,reviewRegion:definition.key,sourceFrame:'um-5t6tz7-v1-2:source-lps'},
    lesson:specimenTeachingFor,titles:{},path:'/specimens/lower-limb',limb:true })),
];
export const specimenReviewRows = registry.map((r) => ({
  key: r.definition.key,
  name: r.definition.label,
  surfaces: r.definition.surfaces.map((s) => ({
    id: s.id,
    name: s.name,
    laterality: s.laterality,
  })),
}));
async function digest(v: unknown) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(
      canonicalSpecimenValue(JSON.parse(JSON.stringify(v))),
    ),
  );
  return Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export async function specimenReviewMaterial(
  specimenKey: string,
  structureId: string,
) {
  const r = registry.find((r) => r.definition.key === specimenKey),
    s = r?.definition.surfaces.find((s) => s.id === structureId);
  if (!r || !s) return null;
  const lesson = r.lesson(r.definition, s);
  const defaultStudy = r.definition.studies.find(study => study.id === r.definition.initialStudy && study.ids.includes(s.id))
    ?? r.definition.studies.find(study => study.ids.includes(s.id));
  const options = { selectedId:s.id, studyId:defaultStudy?.id ?? null, view:defaultStudy?.view ?? 'anterior' as const };
  const atlasLink = r.limb ? makeSpecimenLink(r.definition,options) : await makeIndependentStudyLink(r.definition,options);
  const topics = specimenTopics.map((tab) => ({
    tab,
    body:
      tab === "anatomy" || tab === "function"
        ? (lesson?.[tab] ?? null)
        : (lesson?.extended?.topics[tab]?.body ?? null),
    references:
      tab === "anatomy" || tab === "function"
        ? (lesson?.references ?? [])
        : (lesson?.extended?.topics[tab]?.references ?? []),
  }));
  const source = {
    specimenKey,
    sourceFrame: r.raw.sourceFrame,
    structure: s,
    catalogue: r.raw,
    studies: r.definition.studies,
    limitations: r.definition.limitations,
  };
  const sourceGuide = r.guide?.(r.definition);
  const guidedDissection = sourceGuide?.steps.some(step => step.ids.includes(s.id)) ? sourceGuide : null;
  const teaching = {
    topics,
    lesson,
    referenceTitles: r.titles as Record<string, string>,
    ...(lesson?.motorGroups?.length ? { motorSupplies: lesson.motorGroups.map(m => ({...m,...motorNerves[m.nerve]})) } : {}),
    // The exact captions, order, camera views and surrounding source IDs are
    // review material, not an unversioned renderer-only teaching overlay.
    ...(guidedDissection ? { guidedDissection } : {}),
  };
  const sourceHash = await digest(source),
    teachingHash = await digest(teaching);
  const checklists = structuredClone(specimenChecklists);
  if (guidedDissection) checklists.teaching.push({ id: 'guided-dissection',
    label: 'Inspect every guided step in the actual source viewer: caption, side, visible neighbours, selection and camera frame. These steps do not validate surgical planes or scan registration.' });
  const identity = {
    catalogScope: specimenReviewScope,
    specimenKey,
    sourceFrame: r.raw.sourceFrame,
    structureId,
    checklistVersion: specimenChecklistVersion,
  };
  const materialHash = await digest({
    identity,
    sourceHash,
    teachingHash,
    renderer: renderer.sha256,
    checklist: checklists,
  });
  const teachingTabs = [
    ...topics.filter((t) => t.body !== null).map((t) => t.tab),
    ...(lesson?.extended?.selfCheck ? ["self-check"] : []),
    ...(guidedDissection ? ['guided-dissection'] : []),
  ];
  const context: SpecimenReviewContext = {
    ...identity,
    structureName: s.name,
    materialHash,
    sourceHash,
    teachingHash,
    rendererHash: renderer.sha256,
    teachingTabs,
    checklists,
    blockers: {
      geometry: atlasLink ? [] : ['The exact source/study link is unavailable. Resolve this binding before geometry approval.'],
      teaching: ["anatomy", "function", "clinical", "pathology"]
        .filter((t) => !teachingTabs.includes(t))
        .map(
          (t) =>
            `The ${t} topic is pending; complete it before teaching sign-off.`,
        ),
      imaging: [
        "No validated acquired-image series or spatial registration is connected. Imaging approval is unavailable.",
      ],
    },
    revisions: {
      geometry: await digest({
        identity,
        sourceHash,
        renderer: renderer.sha256,
        checklist: checklists.geometry,
      }),
      teaching: await digest({
        identity,
        sourceHash,
        teachingHash,
        checklist: checklists.teaching,
      }),
      imaging: null,
    },
  };
  return structuredClone({ context, source, teaching, atlasPath: r.path, atlasLink });
}
export type SpecimenReviewMaterial = NonNullable<
  Awaited<ReturnType<typeof specimenReviewMaterial>>
>;
