import { hraRenalDefinition } from "./hra-renal";
import { hraRenalTeaching } from "./hra-renal-teaching";
import { hraPelvisDefinition } from "./hra-pelvis";
import { hraPelvicTeaching } from "./hra-pelvis-teaching";
import renal from "../public/models/hra-renal/catalog.json";
import pelvis from "../public/models/hra-pelvis/catalog.json";
import renderer from "../content/body-renderer-revision.json";
import { hraRenalReferenceTitles } from "../content/hra-renal-teaching";
import { hraPelvicReferenceTitles } from "../content/hra-pelvic-teaching";
import { specimenTopics } from "./specimen-links";
import { canonicalSpecimenValue } from "./specimen-links";
import {
  specimenChecklists,
  specimenChecklistVersion,
  specimenReviewScope,
  type SpecimenReviewContext,
} from "./specimen-review";

// Explicit source adapters only. More donors require their own admitted source,
// frame and teaching adapter, not inferred identity matches or migrated approvals.
const registry = [
  {
    definition: hraRenalDefinition,
    raw: renal,
    lesson: hraRenalTeaching,
    titles: hraRenalReferenceTitles,
    path: "/specimens/kidneys",
  },
  {
    definition: hraPelvisDefinition,
    raw: pelvis,
    lesson: hraPelvicTeaching,
    titles: hraPelvicReferenceTitles,
    path: "/specimens/female-pelvis",
  },
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
  const teaching = {
    topics,
    lesson,
    referenceTitles: r.titles as Record<string, string>,
  };
  const sourceHash = await digest(source),
    teachingHash = await digest(teaching);
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
    checklist: specimenChecklists,
  });
  const teachingTabs = [
    ...topics.filter((t) => t.body !== null).map((t) => t.tab),
    ...(lesson?.extended?.selfCheck ? ["self-check"] : []),
  ];
  const context: SpecimenReviewContext = {
    ...identity,
    structureName: s.name,
    materialHash,
    sourceHash,
    teachingHash,
    rendererHash: renderer.sha256,
    teachingTabs,
    checklists: structuredClone(specimenChecklists),
    blockers: {
      geometry: [],
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
        checklist: specimenChecklists.geometry,
      }),
      teaching: await digest({
        identity,
        sourceHash,
        teachingHash,
        checklist: specimenChecklists.teaching,
      }),
      imaging: null,
    },
  };
  return structuredClone({ context, source, teaching, atlasPath: r.path });
}
export type SpecimenReviewMaterial = NonNullable<
  Awaited<ReturnType<typeof specimenReviewMaterial>>
>;
