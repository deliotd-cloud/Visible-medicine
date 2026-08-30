import { env } from "cloudflare:workers";
import {
  createAssessmentManifestRecord,
  parseAndVerifyAssessmentManifest,
  type AssessmentManifest,
  type AssessmentManifestCase,
  type AssessmentManifestRecord,
} from "@/lib/assessment-manifest";
import { allowedTools, sha256 } from "@/lib/domain";
import {
  educationGeometryForCase,
  educationWsiIdentifiersForCase,
} from "@/lib/education-viewer-adapter";

export const EDUCATION_VIEWER_CORE_VERSION =
  "visible-medicine-viewer@1.0.0";

type DatabaseRow = Record<string, string | number | null>;

export class AssessmentVersionIntegrityError extends Error {
  readonly code = "ASSESSMENT_VERSION_INTEGRITY_FAILURE";
}

function rows<T extends DatabaseRow>(result: D1Result<T>): T[] {
  return result.results ?? [];
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

type SupplementalPublicationContent = {
  teachingContent: readonly unknown[];
  teachingPolls: readonly unknown[];
};

function canonicalJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJsonValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, item]) => [key, canonicalJsonValue(item)]),
    );
  if (["string", "number", "boolean"].includes(typeof value) || value === null)
    return value;
  throw new AssessmentVersionIntegrityError(
    "Supplemental publication content is not JSON-safe.",
  );
}

async function supplementalIntegrity(
  content: SupplementalPublicationContent,
) {
  return {
    teachingContentHash: await sha256(
      JSON.stringify(canonicalJsonValue(content.teachingContent)),
    ),
    teachingPollsHash: await sha256(
      JSON.stringify(canonicalJsonValue(content.teachingPolls)),
    ),
  };
}

export function assessmentMediaForCase(
  caseId: string,
  classification: string,
): AssessmentManifestCase["media"] {
  const wsi = educationWsiIdentifiersForCase(caseId);
  const wsiSeries: AssessmentManifestCase["media"]["series"][number] = {
    order: 1,
    studyInstanceUid: wsi.studyInstanceUid,
    seriesInstanceUid: wsi.seriesInstanceUid,
    frameOfReferenceUid: wsi.frameOfReferenceUid,
    plane: "slide",
    frameCount: 1,
    sopInstanceUids: [wsi.sopInstanceUid],
  };
  if (classification === "pathology")
    return { kind: "wsi", overview: true, series: [wsiSeries] };
  const dicom = educationGeometryForCase(caseId).map((series, index) => ({
    order: index + 1,
    studyInstanceUid: series.studyInstanceUid,
    seriesInstanceUid: series.seriesInstanceUid,
    frameOfReferenceUid: series.frameOfReferenceUid,
    plane: series.plane,
    frameCount: series.frames.length,
    sopInstanceUids: series.frames.map((frame) => frame.sopInstanceUid),
  }));
  if (classification === "mixed")
    return {
      kind: "mixed",
      overview: true,
      series: [
        ...dicom,
        { ...wsiSeries, order: dicom.length + 1 },
      ],
    };
  return { kind: "dicom", overview: false, series: dicom };
}

function normalizedQuestionOptions(value: unknown) {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry, index) => {
    if (typeof entry === "string")
      return { id: `option-${index + 1}`, label: entry, order: index + 1 };
    const item = entry && typeof entry === "object"
      ? entry as Record<string, unknown>
      : {};
    return {
      id: typeof item.id === "string" ? item.id : `option-${index + 1}`,
      label: typeof item.label === "string" ? item.label : "",
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : index + 1,
    };
  });
}

function normalizedRubricCriteria(value: unknown) {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry, index) => {
    const item = entry && typeof entry === "object"
      ? entry as Record<string, unknown>
      : {};
    return {
      label: typeof item.label === "string" ? item.label : "",
      maxMarks: Number(item.maxMarks ?? item.marks),
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : index + 1,
    };
  });
}

export async function buildAssessmentManifestFromDatabase(
  workbookId: string,
  viewerCoreVersion = EDUCATION_VIEWER_CORE_VERSION,
  supplementalPublicationContent: SupplementalPublicationContent = {
    teachingContent: [],
    teachingPolls: [],
  },
): Promise<AssessmentManifestRecord> {
  const workbook = await env.DB.prepare(
    `SELECT id, title, mode, version, duration_minutes, dual_display_allowed
       FROM workbooks
      WHERE id = ?`,
  ).bind(workbookId).first<DatabaseRow>();
  if (!workbook)
    throw new AssessmentVersionIntegrityError("Workbook source is unavailable.");

  const result = await env.DB.prepare(
    `SELECT wc.position AS case_position,
            c.id AS case_id, c.title AS case_title,
            c.description AS case_description, c.classification,
            c.version AS case_version, c.visual_kind, c.tools_json,
            c.publication_hash, c.status AS case_status,
            c.deidentified, c.publication_cleared,
            q.id AS question_id, COALESCE(qe.prompt, q.prompt) AS prompt, q.response_type,
            q.options_json, q.max_marks, q.position AS question_position,
            q.version + COALESCE(qe.revision, 0) AS question_version,
            r.version AS rubric_version, r.criteria_json
       FROM workbook_cases wc
       JOIN cases c ON c.id = wc.case_id
       LEFT JOIN questions q ON q.case_id = c.id
       LEFT JOIN workbook_draft_question_edits qe
         ON qe.workbook_id = wc.workbook_id AND qe.question_id = q.id
       LEFT JOIN rubrics r ON r.id = (
         SELECT r2.id
           FROM rubrics r2
          WHERE r2.question_id = q.id AND r2.status = 'published'
          ORDER BY r2.version DESC, r2.id DESC
          LIMIT 1
       )
      WHERE wc.workbook_id = ?
      ORDER BY wc.position, q.position, q.id`,
  ).bind(workbookId).all<DatabaseRow>();
  const sourceRows = rows(result);
  if (!sourceRows.length)
    throw new AssessmentVersionIntegrityError("Workbook has no selected cases.");

  const cases = new Map<string, AssessmentManifestCase>();
  for (const row of sourceRows) {
    const caseId = String(row.case_id);
    let assessmentCase = cases.get(caseId);
    if (!assessmentCase) {
      if (
        row.case_status !== "published" ||
        Number(row.deidentified) !== 1 ||
        Number(row.publication_cleared) !== 1 ||
        ["unsupported", "requires-review"].includes(String(row.classification))
      )
        throw new AssessmentVersionIntegrityError(
          `Case ${caseId} has not passed Education publication controls.`,
        );
      assessmentCase = {
        id: caseId,
        title: String(row.case_title),
        description: String(row.case_description),
        classification: String(row.classification) as AssessmentManifestCase["classification"],
        version: Number(row.case_version),
        visualKind: String(row.visual_kind),
        tools: Array.isArray(parseJson(row.tools_json))
          ? parseJson(row.tools_json) as string[]
          : [],
        publicationHash: String(row.publication_hash),
        order: Number(row.case_position),
        media: assessmentMediaForCase(caseId, String(row.classification)),
        questions: [],
      };
      cases.set(caseId, assessmentCase);
    }
    if (row.question_id === null) continue;
    if (row.rubric_version === null || row.criteria_json === null)
      throw new AssessmentVersionIntegrityError(
        `Question ${String(row.question_id)} has no published rubric.`,
      );
    const criteria = normalizedRubricCriteria(row.criteria_json);
    assessmentCase.questions.push({
      id: String(row.question_id),
      prompt: String(row.prompt),
      responseType: String(row.response_type) as AssessmentManifestCase["questions"][number]["responseType"],
      options: normalizedQuestionOptions(row.options_json),
      maxMarks: Number(row.max_marks),
      order: Number(row.question_position),
      version: Number(row.question_version),
      rubric: {
        version: Number(row.rubric_version),
        maxMarks: criteria.reduce((total, criterion) => total + criterion.maxMarks, 0),
        criteria,
      },
    });
  }

  return createAssessmentManifestRecord({
    schema: "didanix-education-assessment-manifest-v2",
    product: "Visible Medicine",
    intendedPurpose: "education-only",
    workbook: {
      id: String(workbook.id),
      title: String(workbook.title),
      mode: String(workbook.mode),
      version: Number(workbook.version),
    },
    assessment: {
      durationMinutes: Number(workbook.duration_minutes),
      displayPolicy: {
        dualDisplayAllowed: Number(workbook.dual_display_allowed) === 1,
      },
    },
    viewer: { coreVersion: viewerCoreVersion },
    supplementalIntegrity: await supplementalIntegrity(
      supplementalPublicationContent,
    ),
    cases: [...cases.values()],
  });
}

type AssessmentVersionRow = {
  id: string;
  workbook_id: string;
  version: number;
  integrity_hash: string;
  manifest_json: string | null;
  viewer_core_version: string;
  status: string;
  dual_display_allowed: number;
};

export type VerifiedAssessmentVersion = {
  id: string;
  integrityHash: string;
  manifest: AssessmentManifest;
};

export async function verifyAssessmentVersionRow(
  row: AssessmentVersionRow,
): Promise<VerifiedAssessmentVersion> {
  if (row.status !== "published")
    throw new AssessmentVersionIntegrityError("Assessment version is not published.");
  try {
    const manifest = await parseAndVerifyAssessmentManifest(
      row.manifest_json,
      row.integrity_hash,
    );
    if (
      manifest.workbook.id !== row.workbook_id ||
      manifest.workbook.version !== Number(row.version) ||
      manifest.viewer.coreVersion !== row.viewer_core_version ||
      manifest.assessment.displayPolicy.dualDisplayAllowed !==
        (Number(row.dual_display_allowed) === 1)
    )
      throw new AssessmentVersionIntegrityError(
        "Assessment version metadata does not match its manifest.",
      );
    return { id: row.id, integrityHash: row.integrity_hash, manifest };
  } catch (error) {
    if (error instanceof AssessmentVersionIntegrityError) throw error;
    throw new AssessmentVersionIntegrityError(
      error instanceof Error
        ? error.message
        : "Assessment version integrity verification failed.",
    );
  }
}

export async function getVerifiedAssessmentManifest(
  assessmentVersionId: string,
): Promise<VerifiedAssessmentVersion> {
  const row = await env.DB.prepare(
    `SELECT id, workbook_id, version, integrity_hash, manifest_json,
            viewer_core_version, status, dual_display_allowed
       FROM assessment_versions
      WHERE id = ?`,
  ).bind(assessmentVersionId).first<AssessmentVersionRow>();
  if (!row)
    throw new AssessmentVersionIntegrityError("Assessment version is unavailable.");
  return verifyAssessmentVersionRow(row);
}

export function manifestQuestions(manifest: AssessmentManifest) {
  return manifest.cases.flatMap((assessmentCase) =>
    assessmentCase.questions.map((question) => ({
      ...question,
      caseId: assessmentCase.id,
      caseOrder: assessmentCase.order,
    })),
  );
}

const SEEDED_CASES = [
  {
    id: "case-liver",
    title: "Hepatic lesion characterisation",
    description: "Characterise an incidental focal liver lesion on multiphase CT.",
    classification: "radiology",
    visualKind: "ct-abdomen",
    publicationHash: "sha256:edu-case-liver-v1",
    questionId: "q-liver",
    prompt: "Describe the principal imaging finding and give the most likely diagnosis.",
  },
  {
    id: "case-chest",
    title: "Thoracic staging",
    description: "Review an axial chest CT for staging-relevant findings.",
    classification: "radiology",
    visualKind: "ct-chest",
    publicationHash: "sha256:edu-case-chest-v1",
    questionId: "q-chest",
    prompt: "Identify the staging-relevant thoracic abnormality and explain its significance.",
  },
  {
    id: "case-colon",
    title: "Colonic adenocarcinoma",
    description: "Review an H&E whole-slide teaching case.",
    classification: "pathology",
    visualKind: "wsi-colon",
    publicationHash: "sha256:edu-case-colon-v1",
    questionId: "q-colon",
    prompt: "Describe the glandular and stromal features that support the diagnosis.",
  },
  {
    id: "case-mixed",
    title: "Radiology–pathology correlation",
    description: "Correlate staging CT with the corresponding de-identified biopsy slide.",
    classification: "mixed",
    visualKind: "mixed",
    publicationHash: "sha256:edu-case-mixed-v1",
    questionId: "q-mixed",
    prompt: "Correlate the radiological and histological findings in a single integrated conclusion.",
  },
] as const;

async function knownSeedManifest(
  workbook: {
    id: string;
    title: string;
    mode: "assessment" | "teaching";
    durationMinutes: number;
    dualDisplayAllowed: boolean;
  },
  supplementalPublicationContent: SupplementalPublicationContent = {
    teachingContent: [],
    teachingPolls: [],
  },
) {
  return createAssessmentManifestRecord({
    schema: "didanix-education-assessment-manifest-v2",
    product: "Visible Medicine",
    intendedPurpose: "education-only",
    workbook: { id: workbook.id, title: workbook.title, mode: workbook.mode, version: 1 },
    assessment: {
      durationMinutes: workbook.durationMinutes,
      displayPolicy: { dualDisplayAllowed: workbook.dualDisplayAllowed },
    },
    viewer: { coreVersion: EDUCATION_VIEWER_CORE_VERSION },
    supplementalIntegrity: await supplementalIntegrity(
      supplementalPublicationContent,
    ),
    cases: SEEDED_CASES.map((seededCase, index) => ({
      id: seededCase.id,
      title: seededCase.title,
      description: seededCase.description,
      classification: seededCase.classification,
      version: 1,
      visualKind: seededCase.visualKind,
      tools: allowedTools(seededCase.classification),
      publicationHash: seededCase.publicationHash,
      order: index + 1,
      media: assessmentMediaForCase(seededCase.id, seededCase.classification),
      questions: [{
        id: seededCase.questionId,
        prompt: seededCase.prompt,
        responseType: "long-text",
        options: [],
        maxMarks: 10,
        order: 1,
        version: 1,
        rubric: {
          version: 1,
          maxMarks: 10,
          criteria: [
            { label: "Observation", maxMarks: 4, order: 1 },
            { label: "Interpretation", maxMarks: 4, order: 2 },
            { label: "Clarity", maxMarks: 2, order: 3 },
          ],
        },
      }],
    })),
  });
}

const LEGACY_SEED_VERSIONS = {
  "assessment-v1": {
    legacyHash: "sha256:assessment-cross-modality-v1",
    workbook: {
      id: "workbook-assessment",
      title: "Cross-modality assessment",
      mode: "assessment" as const,
      durationMinutes: 75,
      dualDisplayAllowed: false,
    },
    supplementalPublicationContent: {
      teachingContent: [],
      teachingPolls: [],
    },
  },
  "teaching-demo-v1": {
    legacyHash: "sha256:teaching-demo-v1",
    workbook: {
      id: "workbook-teaching-demo",
      title: "Guided imaging teaching session",
      mode: "teaching" as const,
      durationMinutes: 0,
      dualDisplayAllowed: true,
    },
    supplementalPublicationContent: {
      teachingContent: [],
      teachingPolls: [{
        id: "poll-liver-enhancement",
        case_id: "case-liver",
        prompt: "Which enhancement pattern best supports the teaching diagnosis in this case?",
        selection_mode: "single",
        options_json: JSON.stringify([
          { id: "option-1", label: "Discontinuous peripheral nodular enhancement with progressive fill-in" },
          { id: "option-2", label: "Homogeneous arterial enhancement followed by washout" },
          { id: "option-3", label: "A thick irregular enhancing rim with central non-enhancement" },
          { id: "option-4", label: "No enhancement across the available phases" },
        ]),
        correct_option_ids_json: JSON.stringify(["option-1"]),
        explanation: "The characteristic teaching pattern is discontinuous peripheral nodular enhancement followed by progressive centripetal fill-in.",
        position: 1,
        version: 1,
      }],
    },
  },
} as const;

export async function backfillKnownAssessmentManifests() {
  for (const [versionId, definition] of Object.entries(LEGACY_SEED_VERSIONS)) {
    const existing = await env.DB.prepare(
      `SELECT integrity_hash, manifest_json FROM assessment_versions WHERE id = ?`,
    ).bind(versionId).first<{
      integrity_hash: string;
      manifest_json: string | null;
    }>();
    if (
      !existing ||
      existing.manifest_json ||
      existing.integrity_hash !== definition.legacyHash
    ) continue;
    const record = await knownSeedManifest(
      definition.workbook,
      definition.supplementalPublicationContent,
    );
    await env.DB.prepare(
      `UPDATE assessment_versions
          SET manifest_json = ?, integrity_hash = ?
        WHERE id = ? AND manifest_json IS NULL AND integrity_hash = ?`,
    ).bind(
      record.manifestJson,
      record.integrityHash,
      versionId,
      definition.legacyHash,
    ).run();
  }
}
