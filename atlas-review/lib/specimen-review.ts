import {
  validateBodyReviewDraft,
  type BodyReviewDraft,
  type BodyReviewCheck,
} from "./body-review-decisions";

export const specimenReviewScope = "independent-specimen" as const;
export const specimenReviewTracks = [
  "geometry",
  "teaching",
  "imaging",
] as const;
export type SpecimenReviewTrack = (typeof specimenReviewTracks)[number];
export type SpecimenReviewDraft = BodyReviewDraft;
export const specimenChecklistVersion = "specimen-review-1";
export type SpecimenReviewContext = {
  catalogScope: typeof specimenReviewScope;
  specimenKey: string;
  sourceFrame: string;
  structureId: string;
  structureName: string;
  materialHash: string;
  sourceHash: string;
  teachingHash: string;
  rendererHash: string;
  checklistVersion: string;
  teachingTabs: string[];
  revisions: Record<SpecimenReviewTrack, string | null>;
  checklists: Record<SpecimenReviewTrack, BodyReviewCheck[]>;
  blockers: Record<SpecimenReviewTrack, string[]>;
};
export type SavedSpecimenReview = SpecimenReviewDraft & {
  eventSchema: "vm-specimen-review-event-1";
  catalogScope: typeof specimenReviewScope;
  specimenKey: string;
  sourceFrame: string;
  structureId: string;
  track: SpecimenReviewTrack;
  version: number;
  savedAt: string;
  reviewedAt: string | null;
  revisionHash: string | null;
  checklistVersion: string;
  checklist: BodyReviewCheck[];
  material: Pick<
    SpecimenReviewContext,
    | "materialHash"
    | "sourceHash"
    | "teachingHash"
    | "rendererHash"
    | "teachingTabs"
  >;
};
export const isSpecimenReviewTrack = (v: unknown): v is SpecimenReviewTrack =>
  specimenReviewTracks.some((t) => t === v);
export const specimenChecklists: SpecimenReviewContext["checklists"] = {
  geometry: [
    {
      id: "identity",
      label:
        "Confirm this exact specimen, source label, laterality, grouped parts and source frame.",
    },
    {
      id: "shape",
      label:
        "Inspect shape, source cut boundaries, landmarks and represented attachments in the actual 3D viewer.",
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
export function blankSpecimenReview(
  c: SpecimenReviewContext,
  track: SpecimenReviewTrack,
): SpecimenReviewDraft {
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
export function specimenApprovalProblems(
  d: SpecimenReviewDraft,
  c: SpecimenReviewContext,
  track: SpecimenReviewTrack,
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
export function specimenReviewStale(
  r: SavedSpecimenReview,
  c: SpecimenReviewContext,
) {
  return (
    r.catalogScope !== c.catalogScope ||
    r.specimenKey !== c.specimenKey ||
    r.sourceFrame !== c.sourceFrame ||
    r.structureId !== c.structureId ||
    r.checklistVersion !== c.checklistVersion ||
    r.revisionHash !== c.revisions[r.track]
  );
}
export function specimenDecisionLabel(
  r: SavedSpecimenReview | undefined,
  c: SpecimenReviewContext,
) {
  return !r
    ? "Not started"
    : specimenReviewStale(r, c)
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
export function parseSavedSpecimenReview(v: unknown): SavedSpecimenReview {
  if (
    !object(v) ||
    v.eventSchema !== "vm-specimen-review-event-1" ||
    v.catalogScope !== specimenReviewScope ||
    !isSpecimenReviewTrack(v.track) ||
    !Number.isSafeInteger(v.version) ||
    Number(v.version) < 1 ||
    Number(v.version) > 2147483647 ||
    !Array.isArray(v.checklist) ||
    !v.checklist.length ||
    v.checklist.length > 30 ||
    !object(v.material)
  )
    throw Error("Invalid specimen review.");
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
    (v.track === "imaging" ||
      v.revisionHash === null ||
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
    eventSchema: "vm-specimen-review-event-1",
    catalogScope: specimenReviewScope,
    specimenKey: text(v.specimenKey),
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
