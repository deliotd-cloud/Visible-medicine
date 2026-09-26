import { parseNestedReviewKey } from "./nested-review-key";
import {
  validateBodyReviewDraft,
  type BodyReviewDraft,
  type BodyReviewCheck,
} from "./body-review-decisions";

export const nestedReviewScope = "nested-dissection" as const;
export const nestedReviewTracks = [
  "geometry",
  "teaching",
  "imaging",
] as const;
export type NestedReviewTrack = (typeof nestedReviewTracks)[number];
export type NestedReviewDraft = BodyReviewDraft;
export const nestedChecklistVersion = "nested-review-1";
export type NestedReviewContext = {
  catalogScope: typeof nestedReviewScope;
  nestedKey: string;
  sourceFrame: string;
  structureId: string;
  structureName: string;
  materialHash: string;
  sourceHash: string;
  teachingHash: string;
  rendererHash: string;
  checklistVersion: string;
  teachingTabs: string[];
  revisions: Record<NestedReviewTrack, string | null>;
  checklists: Record<NestedReviewTrack, BodyReviewCheck[]>;
  blockers: Record<NestedReviewTrack, string[]>;
};
export type SavedNestedReview = NestedReviewDraft & {
  eventSchema: "vm-nested-review-event-1";
  catalogScope: typeof nestedReviewScope;
  nestedKey: string;
  sourceFrame: string;
  structureId: string;
  track: NestedReviewTrack;
  version: number;
  savedAt: string;
  reviewedAt: string | null;
  revisionHash: string | null;
  checklistVersion: string;
  checklist: BodyReviewCheck[];
  material: Pick<
    NestedReviewContext,
    | "materialHash"
    | "sourceHash"
    | "teachingHash"
    | "rendererHash"
    | "teachingTabs"
  >;
};
export const isNestedReviewTrack = (v: unknown): v is NestedReviewTrack =>
  nestedReviewTracks.some((t) => t === v);
export const nestedChecklists: NestedReviewContext["checklists"] = {
  geometry: [
    {
      id: "identity",
      label:
        "Confirm this exact parent, dissection study, child source, laterality, grouped parts and source frame.",
    },
    {
      id: "shape",
      label:
        "Inspect this child's shape, retained source boundaries, landmarks and relationships in the actual nested 3D study.",
    },
    {
      id: "relations",
      label:
        "Review neighbouring surfaces and source holds. Do not infer missing tissues, lumens or drainage connections.",
    },
    {
      id: "dissection",
      label:
        "Check labels, rotation, isolation, separation and exact reassembly on the intended devices.",
    },
    {
      id: "scope",
      label:
        "Record the specific educational scope, omissions and limitations; this is not patient or operative anatomy certification.",
    },
  ],
  teaching: [
    {
      id: "copy",
      label:
        "Read every available topic and its source references, including modality descriptions.",
    },
    {
      id: "limits",
      label:
        "Check model-specific cautions, laterality, clinical/pathology wording and all pending topics.",
    },
    {
      id: "assessment",
      label:
        "Check the supplied self-check question and answer. Interactive identification practice is outside this sign-off.",
    },
    {
      id: "scope",
      label:
        "Record learner level and exact scope. Text review does not validate acquired scans, registration or separate lectures.",
    },
  ],
  imaging: [
    {
      id: "rights",
      label:
        "Verify acquired-image rights, de-identification and patient/reference identity.",
    },
    {
      id: "frame",
      label:
        "Validate series/frame metadata, orientation, units, measured registration error and both-direction mappings.",
    },
  ],
};
export function blankNestedReview(
  c: NestedReviewContext,
  track: NestedReviewTrack,
): NestedReviewDraft {
  return {
    status: "draft",
    reviewer: "",
    qualification: "",
    scope: "",
    notes: "",
    evidence: [],
    issues: [],
    attested: false,
    checks: Object.fromEntries(c.checklists[track].map((x) => [x.id, false])),
  };
}
export function nestedApprovalProblems(
  d: NestedReviewDraft,
  c: NestedReviewContext,
  track: NestedReviewTrack,
) {
  return [
    ...c.blockers[track],
    ...(!c.revisions[track] ? ["No approvable revision for this track."] : []),
    ...(c.checklists[track].some((x) => d.checks[x.id] !== true)
      ? ["Complete every checklist item."]
      : []),
    ...(d.issues.some((x) => !x.resolved)
      ? ["Resolve all issues with explanations."]
      : []),
    ...(!d.reviewer || !d.qualification
      ? ["Provide your name and professional qualification."]
      : []),
    ...(d.scope.trim().length < 10
      ? ["Describe the precise scope reviewed."]
      : []),
    ...(!d.evidence.length ? ["Add supporting HTTPS evidence."] : []),
    ...(!d.attested ? ["Confirm you personally performed the review."] : []),
  ];
}
export function nestedReviewStale(
  r: SavedNestedReview,
  c: NestedReviewContext,
) {
  return (
    r.catalogScope !== c.catalogScope ||
    r.nestedKey !== c.nestedKey ||
    r.sourceFrame !== c.sourceFrame ||
    r.structureId !== c.structureId ||
    r.checklistVersion !== c.checklistVersion ||
    r.revisionHash !== c.revisions[r.track]
  );
}
export function nestedDecisionLabel(
  r: SavedNestedReview | undefined,
  c: NestedReviewContext,
) {
  return !r
    ? "Not started"
    : nestedReviewStale(r, c)
      ? "Re-review required"
      : r.status === "approved"
        ? "Approval recorded"
        : r.status === "changes-required"
          ? "Changes required"
          : "In progress";
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 256): string => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw Error("Invalid stored review text.");
  return v;
};
const hash = (v: unknown): string => {
  const s = text(v, 64);
  if (!/^[a-f0-9]{64}$/.test(s)) throw Error("Invalid review hash.");
  return s;
};
const date = (v: unknown) => {
  const s = text(v, 40);
  if (!Number.isFinite(Date.parse(s)) || new Date(s).toISOString() !== s)
    throw Error("Invalid review date.");
  return s;
};
export function parseSavedNestedReview(v: unknown): SavedNestedReview {
  if (
    !object(v) ||
    v.eventSchema !== "vm-nested-review-event-1" ||
    v.catalogScope !== nestedReviewScope ||
    !isNestedReviewTrack(v.track) || v.track === "imaging" ||
    !Number.isSafeInteger(v.version) ||
    Number(v.version) < 1 ||
    Number(v.version) > 2147483647 ||
    !Array.isArray(v.checklist) ||
    !v.checklist.length ||
    v.checklist.length > 30 ||
    !object(v.material)
  )
    throw Error("Invalid nested review.");
  const checklist = v.checklist.map((x) => {
    if (!object(x)) throw Error("Invalid checklist.");
    return { id: text(x.id, 80), label: text(x.label, 1000) };
  });
  if (new Set(checklist.map((x) => x.id)).size !== checklist.length)
    throw Error("Duplicate checklist keys.");
  const draft = validateBodyReviewDraft(v, checklist),
    m = v.material;
  if (
    !Array.isArray(m.teachingTabs) ||
    m.teachingTabs.length > 9 ||
    m.teachingTabs.some(
      (t) =>
        ![
          "anatomy",
          "function",
          "clinical",
          "pathology",
          "ct",
          "mri",
          "xray",
          "ultrasound",
          "self-check",
        ].includes(String(t)),
    ) ||
    new Set(m.teachingTabs).size !== m.teachingTabs.length
  )
    throw Error("Invalid teaching scope.");
  if (
    draft.status === "approved" &&
    (v.revisionHash === null ||
      v.reviewedAt === null ||
      !draft.attested ||
      !draft.reviewer ||
      !draft.qualification ||
      draft.scope.length < 10 ||
      !draft.evidence.length ||
      draft.issues.some((x) => !x.resolved) ||
      checklist.some((x) => !draft.checks[x.id]))
  )
    throw Error("Invalid stored approval.");
  if (draft.status !== "approved" && v.reviewedAt !== null)
    throw Error("Non-approval has a review date.");
  return {
    ...draft,
    eventSchema: "vm-nested-review-event-1",
    catalogScope: nestedReviewScope,
    nestedKey: parseNestedReviewKey(v.nestedKey).key,
    sourceFrame: text(v.sourceFrame),
    structureId: text(v.structureId),
    track: v.track,
    version: Number(v.version),
    savedAt: date(v.savedAt),
    reviewedAt: v.reviewedAt === null ? null : date(v.reviewedAt),
    revisionHash: v.revisionHash === null ? null : hash(v.revisionHash),
    checklistVersion: text(v.checklistVersion, 80),
    checklist,
    material: {
      materialHash: hash(m.materialHash),
      sourceHash: hash(m.sourceHash),
      teachingHash: hash(m.teachingHash),
      rendererHash: hash(m.rendererHash),
      teachingTabs: m.teachingTabs as string[],
    },
  };
}
