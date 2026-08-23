import { sha256 } from "@/lib/domain";

export const ASSESSMENT_MANIFEST_SCHEMA_V1 =
  "didanix-education-assessment-manifest-v1" as const;
export const ASSESSMENT_MANIFEST_SCHEMA =
  "didanix-education-assessment-manifest-v2" as const;

export type AssessmentManifestOption = {
  id: string;
  label: string;
  order: number;
};

export type AssessmentManifestCriterion = {
  label: string;
  maxMarks: number;
  order: number;
};

export type AssessmentManifestQuestion = {
  id: string;
  prompt: string;
  responseType: "long-text" | "single-choice" | "multiple-choice";
  options: AssessmentManifestOption[];
  maxMarks: number;
  order: number;
  version: number;
  rubric: {
    version: number;
    maxMarks: number;
    criteria: AssessmentManifestCriterion[];
  };
};

export type AssessmentManifestSeries = {
  order: number;
  studyInstanceUid: string;
  seriesInstanceUid: string;
  frameOfReferenceUid: string;
  plane: "axial" | "coronal" | "sagittal" | "slide";
  frameCount: number;
  sopInstanceUids: string[];
};

export type AssessmentManifestCase = {
  id: string;
  title: string;
  description: string;
  classification:
    | "radiology"
    | "pathology"
    | "mixed"
    | "unsupported"
    | "requires-review";
  version: number;
  visualKind: string;
  tools: string[];
  publicationHash: string;
  order: number;
  media: {
    kind: "dicom" | "wsi" | "mixed";
    overview: boolean;
    series: AssessmentManifestSeries[];
  };
  questions: AssessmentManifestQuestion[];
};

export type AssessmentManifest = {
  schema:
    | typeof ASSESSMENT_MANIFEST_SCHEMA_V1
    | typeof ASSESSMENT_MANIFEST_SCHEMA;
  product: "Elivion Education";
  intendedPurpose: "education-only";
  workbook: {
    id: string;
    title: string;
    mode: "assessment" | "teaching";
    version: number;
  };
  assessment: {
    durationMinutes: number;
    displayPolicy: {
      dualDisplayAllowed: boolean;
    };
  };
  viewer: {
    coreVersion: string;
  };
  supplementalIntegrity?: {
    teachingContentHash: string;
    teachingPollsHash: string;
  };
  cases: AssessmentManifestCase[];
};

export type AssessmentManifestRecord = {
  manifest: AssessmentManifest;
  manifestJson: string;
  integrityHash: string;
};

export class AssessmentManifestError extends Error {
  readonly code = "ASSESSMENT_MANIFEST_INVALID";
}

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AssessmentManifestError(`${label} must be an object.`);
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string) {
  const actual = Object.keys(value).sort();
  const allowed = [...expected].sort();
  if (
    actual.length !== allowed.length ||
    actual.some((key, index) => key !== allowed[index])
  )
    throw new AssessmentManifestError(`${label} has an unsupported shape.`);
}

function text(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string")
    throw new AssessmentManifestError(`${label} must be text.`);
  const normalized = value.replace(/\0/g, "").trim();
  if (!normalized || normalized.length > maxLength)
    throw new AssessmentManifestError(`${label} is empty or too long.`);
  return normalized;
}

function integer(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  const normalized = Number(value);
  if (
    !Number.isSafeInteger(normalized) ||
    normalized < minimum ||
    normalized > maximum
  )
    throw new AssessmentManifestError(`${label} is outside its permitted range.`);
  return normalized;
}

function boolean(value: unknown, label: string) {
  if (typeof value !== "boolean")
    throw new AssessmentManifestError(`${label} must be true or false.`);
  return value;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T))
    throw new AssessmentManifestError(`${label} is not supported.`);
  return value as T;
}

function ordered<T extends { order: number; id?: string }>(
  values: T[],
  label: string,
) {
  const orders = new Set<number>();
  const identifiers = new Set<string>();
  for (const value of values) {
    if (orders.has(value.order))
      throw new AssessmentManifestError(`${label} contains a duplicate order.`);
    orders.add(value.order);
    if (value.id) {
      if (identifiers.has(value.id))
        throw new AssessmentManifestError(`${label} contains a duplicate identifier.`);
      identifiers.add(value.id);
    }
  }
  return [...values].sort(
    (left, right) =>
      left.order - right.order ||
      ((left.id ?? "") < (right.id ?? "")
        ? -1
        : (left.id ?? "") > (right.id ?? "")
          ? 1
          : 0),
  );
}

function uid(value: unknown, label: string) {
  const normalized = text(value, label, 64);
  if (!/^\d+(?:\.\d+)+$/.test(normalized))
    throw new AssessmentManifestError(`${label} is not a DICOM UID.`);
  return normalized;
}

function validateOptions(
  value: unknown,
  responseType: AssessmentManifestQuestion["responseType"],
) {
  if (!Array.isArray(value))
    throw new AssessmentManifestError("Question options must be an array.");
  const options = value.map((entry, index) => {
    const item = object(entry, `Question option ${index + 1}`);
    exactKeys(item, ["id", "label", "order"], `Question option ${index + 1}`);
    return {
      id: text(item.id, `Question option ${index + 1} identifier`, 100),
      label: text(item.label, `Question option ${index + 1} label`, 1_000),
      order: integer(item.order, `Question option ${index + 1} order`, 1, 100),
    };
  });
  if (responseType === "long-text" && options.length)
    throw new AssessmentManifestError("Long-text questions cannot contain options.");
  if (responseType !== "long-text" && (options.length < 2 || options.length > 20))
    throw new AssessmentManifestError(
      "Choice questions must contain between two and twenty options.",
    );
  return ordered(options, "Question options");
}

function validateRubric(value: unknown, questionMaxMarks: number) {
  const rubric = object(value, "Question rubric");
  exactKeys(rubric, ["version", "maxMarks", "criteria"], "Question rubric");
  if (!Array.isArray(rubric.criteria) || !rubric.criteria.length)
    throw new AssessmentManifestError("Question rubric criteria are required.");
  const criteria = ordered(
    rubric.criteria.map((entry, index) => {
      const item = object(entry, `Rubric criterion ${index + 1}`);
      exactKeys(
        item,
        ["label", "maxMarks", "order"],
        `Rubric criterion ${index + 1}`,
      );
      return {
        label: text(item.label, `Rubric criterion ${index + 1} label`, 200),
        maxMarks: integer(
          item.maxMarks,
          `Rubric criterion ${index + 1} maximum`,
          1,
          1_000,
        ),
        order: integer(
          item.order,
          `Rubric criterion ${index + 1} order`,
          1,
          100,
        ),
      };
    }),
    "Rubric criteria",
  );
  const maxMarks = integer(rubric.maxMarks, "Rubric maximum", 1, 1_000);
  const criteriaMaximum = criteria.reduce(
    (total, criterion) => total + criterion.maxMarks,
    0,
  );
  if (maxMarks !== questionMaxMarks || criteriaMaximum !== maxMarks)
    throw new AssessmentManifestError(
      "Rubric and criterion maximums must equal the question maximum.",
    );
  return {
    version: integer(rubric.version, "Rubric version", 1, 1_000_000),
    maxMarks,
    criteria,
  };
}

function validateQuestions(value: unknown) {
  if (!Array.isArray(value))
    throw new AssessmentManifestError("Case questions must be an array.");
  return ordered(
    value.map((entry, index) => {
      const item = object(entry, `Question ${index + 1}`);
      exactKeys(
        item,
        [
          "id",
          "prompt",
          "responseType",
          "options",
          "maxMarks",
          "order",
          "version",
          "rubric",
        ],
        `Question ${index + 1}`,
      );
      const responseType = oneOf(
        item.responseType,
        ["long-text", "single-choice", "multiple-choice"] as const,
        `Question ${index + 1} response type`,
      );
      const maxMarks = integer(
        item.maxMarks,
        `Question ${index + 1} maximum`,
        1,
        1_000,
      );
      return {
        id: text(item.id, `Question ${index + 1} identifier`, 100),
        prompt: text(item.prompt, `Question ${index + 1} prompt`, 10_000),
        responseType,
        options: validateOptions(item.options, responseType),
        maxMarks,
        order: integer(item.order, `Question ${index + 1} order`, 1, 10_000),
        version: integer(
          item.version,
          `Question ${index + 1} version`,
          1,
          1_000_000,
        ),
        rubric: validateRubric(item.rubric, maxMarks),
      };
    }),
    "Case questions",
  );
}

function validateMedia(value: unknown, classification: AssessmentManifestCase["classification"]) {
  const media = object(value, "Case media");
  exactKeys(media, ["kind", "overview", "series"], "Case media");
  const kind = oneOf(media.kind, ["dicom", "wsi", "mixed"] as const, "Case media kind");
  if (!Array.isArray(media.series) || !media.series.length)
    throw new AssessmentManifestError("Every case requires frozen media identifiers.");
  const series = ordered(
    media.series.map((entry, index) => {
      const item = object(entry, `Media series ${index + 1}`);
      exactKeys(
        item,
        [
          "order",
          "studyInstanceUid",
          "seriesInstanceUid",
          "frameOfReferenceUid",
          "plane",
          "frameCount",
          "sopInstanceUids",
        ],
        `Media series ${index + 1}`,
      );
      if (!Array.isArray(item.sopInstanceUids))
        throw new AssessmentManifestError("SOP Instance UIDs must be an array.");
      const sopInstanceUids = item.sopInstanceUids.map((entryValue, sopIndex) =>
        uid(entryValue, `SOP Instance UID ${sopIndex + 1}`),
      );
      if (new Set(sopInstanceUids).size !== sopInstanceUids.length)
        throw new AssessmentManifestError("SOP Instance UIDs must be unique within a series.");
      const frameCount = integer(
        item.frameCount,
        `Media series ${index + 1} frame count`,
        1,
        100_000,
      );
      if (frameCount !== sopInstanceUids.length)
        throw new AssessmentManifestError(
          "The frozen frame count must match the SOP Instance UID list.",
        );
      return {
        order: integer(item.order, `Media series ${index + 1} order`, 1, 100),
        studyInstanceUid: uid(
          item.studyInstanceUid,
          `Media series ${index + 1} Study Instance UID`,
        ),
        seriesInstanceUid: uid(
          item.seriesInstanceUid,
          `Media series ${index + 1} Series Instance UID`,
        ),
        frameOfReferenceUid: uid(
          item.frameOfReferenceUid,
          `Media series ${index + 1} Frame of Reference UID`,
        ),
        plane: oneOf(
          item.plane,
          ["axial", "coronal", "sagittal", "slide"] as const,
          `Media series ${index + 1} plane`,
        ),
        frameCount,
        sopInstanceUids,
      };
    }),
    "Media series",
  );
  const hasSlide = series.some((item) => item.plane === "slide");
  const hasDicomPlane = series.some((item) => item.plane !== "slide");
  if (
    (classification === "radiology" && (kind !== "dicom" || hasSlide)) ||
    (classification === "pathology" && (kind !== "wsi" || hasDicomPlane)) ||
    (classification === "mixed" && (kind !== "mixed" || !hasSlide || !hasDicomPlane))
  )
    throw new AssessmentManifestError(
      "The media kind is incompatible with the frozen case classification.",
    );
  return {
    kind,
    overview: boolean(media.overview, "Case media overview policy"),
    series,
  };
}

function validateCases(value: unknown, workbookMode: AssessmentManifest["workbook"]["mode"]) {
  if (!Array.isArray(value) || !value.length)
    throw new AssessmentManifestError("A manifest must contain at least one case.");
  const cases = ordered(
    value.map((entry, index) => {
      const item = object(entry, `Case ${index + 1}`);
      exactKeys(
        item,
        [
          "id",
          "title",
          "description",
          "classification",
          "version",
          "visualKind",
          "tools",
          "publicationHash",
          "order",
          "media",
          "questions",
        ],
        `Case ${index + 1}`,
      );
      const classification = oneOf(
        item.classification,
        ["radiology", "pathology", "mixed", "unsupported", "requires-review"] as const,
        `Case ${index + 1} classification`,
      );
      if (!Array.isArray(item.tools))
        throw new AssessmentManifestError("Case tools must be an array.");
      const tools = item.tools.map((tool, toolIndex) => {
        const normalized = text(tool, `Case tool ${toolIndex + 1}`, 50);
        if (!/^[a-z0-9-]+$/.test(normalized))
          throw new AssessmentManifestError("Case tools must use stable identifiers.");
        return normalized;
      });
      if (new Set(tools).size !== tools.length)
        throw new AssessmentManifestError("Case tools must be unique.");
      const questions = validateQuestions(item.questions);
      if (workbookMode === "assessment" && !questions.length)
        throw new AssessmentManifestError("Every assessment case requires a question.");
      return {
        id: text(item.id, `Case ${index + 1} identifier`, 100),
        title: text(item.title, `Case ${index + 1} title`, 500),
        description: text(item.description, `Case ${index + 1} description`, 5_000),
        classification,
        version: integer(item.version, `Case ${index + 1} version`, 1, 1_000_000),
        visualKind: text(item.visualKind, `Case ${index + 1} visual kind`, 100),
        tools,
        publicationHash: text(
          item.publicationHash,
          `Case ${index + 1} publication hash`,
          200,
        ),
        order: integer(item.order, `Case ${index + 1} order`, 1, 10_000),
        media: validateMedia(item.media, classification),
        questions,
      };
    }),
    "Manifest cases",
  );
  const questionIds = new Set<string>();
  for (const assessmentCase of cases)
    for (const question of assessmentCase.questions) {
      if (questionIds.has(question.id))
        throw new AssessmentManifestError(
          "Question identifiers must be unique across the manifest.",
        );
      questionIds.add(question.id);
    }
  return cases;
}

export function validateAssessmentManifest(value: unknown): AssessmentManifest {
  const manifest = object(value, "Assessment manifest");
  exactKeys(
    manifest,
    ["schema", "product", "intendedPurpose", "workbook", "assessment", "viewer", "supplementalIntegrity", "cases"],
    "Assessment manifest",
  );
  if (manifest.schema !== ASSESSMENT_MANIFEST_SCHEMA)
    throw new AssessmentManifestError("Assessment manifest schema is unsupported.");
  if (manifest.product !== "Elivion Education")
    throw new AssessmentManifestError("Assessment manifest product boundary is invalid.");
  if (manifest.intendedPurpose !== "education-only")
    throw new AssessmentManifestError("Assessment manifest purpose is invalid.");

  const workbook = object(manifest.workbook, "Manifest workbook");
  exactKeys(workbook, ["id", "title", "mode", "version"], "Manifest workbook");
  const workbookMode = oneOf(
    workbook.mode,
    ["assessment", "teaching"] as const,
    "Workbook mode",
  );
  const normalizedWorkbook = {
    id: text(workbook.id, "Workbook identifier", 100),
    title: text(workbook.title, "Workbook title", 500),
    mode: workbookMode,
    version: integer(workbook.version, "Workbook version", 1, 1_000_000),
  };

  const assessment = object(manifest.assessment, "Assessment policy");
  exactKeys(
    assessment,
    ["durationMinutes", "displayPolicy"],
    "Assessment policy",
  );
  const displayPolicy = object(assessment.displayPolicy, "Assessment display policy");
  exactKeys(
    displayPolicy,
    ["dualDisplayAllowed"],
    "Assessment display policy",
  );

  const viewer = object(manifest.viewer, "Manifest viewer");
  exactKeys(viewer, ["coreVersion"], "Manifest viewer");
  const supplementalIntegrity = object(
    manifest.supplementalIntegrity,
    "Supplemental publication integrity",
  );
  exactKeys(
    supplementalIntegrity,
    ["teachingContentHash", "teachingPollsHash"],
    "Supplemental publication integrity",
  );
  const teachingContentHash = text(
    supplementalIntegrity.teachingContentHash,
    "Teaching content integrity hash",
    64,
  );
  const teachingPollsHash = text(
    supplementalIntegrity.teachingPollsHash,
    "Teaching polls integrity hash",
    64,
  );
  if (!/^[a-f0-9]{64}$/.test(teachingContentHash) || !/^[a-f0-9]{64}$/.test(teachingPollsHash))
    throw new AssessmentManifestError("Supplemental publication hashes are invalid.");

  return {
    schema: ASSESSMENT_MANIFEST_SCHEMA,
    product: "Elivion Education",
    intendedPurpose: "education-only",
    workbook: normalizedWorkbook,
    assessment: {
      durationMinutes: integer(
        assessment.durationMinutes,
        "Assessment duration",
        0,
        10_000_000,
      ),
      displayPolicy: {
        dualDisplayAllowed: boolean(
          displayPolicy.dualDisplayAllowed,
          "Dual-display policy",
        ),
      },
    },
    viewer: {
      coreVersion: text(viewer.coreVersion, "Viewer core version", 200),
    },
    supplementalIntegrity: { teachingContentHash, teachingPollsHash },
    cases: validateCases(manifest.cases, workbookMode),
  };
}

export function serializeAssessmentManifest(value: unknown) {
  return JSON.stringify(validateAssessmentManifest(value));
}

export async function createAssessmentManifestRecord(
  value: unknown,
): Promise<AssessmentManifestRecord> {
  const manifest = validateAssessmentManifest(value);
  const manifestJson = JSON.stringify(manifest);
  return {
    manifest,
    manifestJson,
    integrityHash: await sha256(manifestJson),
  };
}

export async function parseAndVerifyAssessmentManifest(
  manifestJson: unknown,
  expectedHash: unknown,
): Promise<AssessmentManifest> {
  if (typeof manifestJson !== "string" || !manifestJson.trim())
    throw new AssessmentManifestError("Assessment manifest is unavailable.");
  if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/.test(expectedHash))
    throw new AssessmentManifestError("Assessment manifest hash is unavailable.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new AssessmentManifestError("Assessment manifest JSON is malformed.");
  }
  const parsedObject = object(parsed, "Assessment manifest");
  let manifest: AssessmentManifest;
  let canonicalJson: string;
  if (parsedObject.schema === ASSESSMENT_MANIFEST_SCHEMA_V1) {
    const hasSupplementalIntegrity = Object.prototype.hasOwnProperty.call(
      parsedObject,
      "supplementalIntegrity",
    );
    exactKeys(
      parsedObject,
      hasSupplementalIntegrity
        ? ["schema", "product", "intendedPurpose", "workbook", "assessment", "viewer", "supplementalIntegrity", "cases"]
        : ["schema", "product", "intendedPurpose", "workbook", "assessment", "viewer", "cases"],
      "Assessment manifest",
    );
    const normalized = validateAssessmentManifest({
      ...parsedObject,
      schema: ASSESSMENT_MANIFEST_SCHEMA,
      supplementalIntegrity: hasSupplementalIntegrity
        ? parsedObject.supplementalIntegrity
        : {
          teachingContentHash: "0".repeat(64),
          teachingPollsHash: "0".repeat(64),
        },
    });
    const legacyCanonical = {
      schema: ASSESSMENT_MANIFEST_SCHEMA_V1,
      product: normalized.product,
      intendedPurpose: normalized.intendedPurpose,
      workbook: normalized.workbook,
      assessment: normalized.assessment,
      viewer: normalized.viewer,
      ...(hasSupplementalIntegrity
        ? { supplementalIntegrity: normalized.supplementalIntegrity }
        : {}),
      cases: normalized.cases,
    } satisfies AssessmentManifest;
    canonicalJson = JSON.stringify(legacyCanonical);
    manifest = legacyCanonical;
  } else {
    manifest = validateAssessmentManifest(parsedObject);
    canonicalJson = JSON.stringify(manifest);
  }
  const actualHash = await sha256(canonicalJson);
  if (actualHash !== expectedHash)
    throw new AssessmentManifestError("Assessment manifest integrity check failed.");
  return manifest;
}
