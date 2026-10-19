import { sha256 } from "./domain.ts";
import {
  LectureContentError,
  validateLectureSlides,
  type LectureSlide,
} from "./lecture-content.ts";

export const LECTURE_MANIFEST_SCHEMA = "visible-medicine-lecture-v1" as const;

export type LectureManifest = {
  schema: typeof LECTURE_MANIFEST_SCHEMA;
  product: "Visible Medicine";
  intendedPurpose: "education-only";
  workbook: {
    id: string;
    title: string;
    mode: "lecture";
    version: number;
  };
  slides: LectureSlide[];
};

export type LectureManifestRecord = {
  manifest: LectureManifest;
  manifestJson: string;
  integrityHash: string;
};

export class LectureManifestError extends Error {
  readonly code = "LECTURE_MANIFEST_INVALID";
}

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new LectureManifestError(`${label} must be an object.`);
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string) {
  const actual = Object.keys(value).sort();
  const allowed = [...expected].sort();
  if (
    actual.length !== allowed.length ||
    actual.some((key, index) => key !== allowed[index])
  )
    throw new LectureManifestError(`${label} has an unsupported shape.`);
}

function text(value: unknown, label: string, maximum: number) {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > maximum ||
    value.includes("\0") ||
    value !== value.trim()
  )
    throw new LectureManifestError(`${label} is empty, malformed, or too long.`);
  return value;
}

function identifier(value: unknown, label: string) {
  const parsed = text(value, label, 140);
  if (!/^[A-Za-z0-9][A-Za-z0-9:_-]{0,139}$/.test(parsed))
    throw new LectureManifestError(`${label} must be a simple identifier.`);
  return parsed;
}

function version(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 1_000_000)
    throw new LectureManifestError("Workbook version is outside its permitted range.");
  return value as number;
}

function canonicalLectureManifest(input: unknown): LectureManifest {
  const value = object(input, "Lecture manifest");
  exactKeys(
    value,
    ["schema", "product", "intendedPurpose", "workbook", "slides"],
    "Lecture manifest",
  );
  if (value.schema !== LECTURE_MANIFEST_SCHEMA)
    throw new LectureManifestError("Lecture manifest schema is unsupported.");
  if (value.product !== "Visible Medicine")
    throw new LectureManifestError("Lecture manifest product boundary is invalid.");
  if (value.intendedPurpose !== "education-only")
    throw new LectureManifestError("Lecture manifest purpose is invalid.");

  const workbook = object(value.workbook, "Lecture workbook");
  exactKeys(workbook, ["id", "title", "mode", "version"], "Lecture workbook");
  if (workbook.mode !== "lecture")
    throw new LectureManifestError("Workbook mode must be lecture.");

  let slides: LectureSlide[];
  try {
    slides = validateLectureSlides(value.slides);
  } catch (error) {
    if (error instanceof LectureContentError)
      throw new LectureManifestError(error.message);
    throw error;
  }

  const manifest: LectureManifest = {
    schema: LECTURE_MANIFEST_SCHEMA,
    product: "Visible Medicine",
    intendedPurpose: "education-only",
    workbook: {
      id: identifier(workbook.id, "Workbook identifier"),
      title: text(workbook.title, "Workbook title", 160),
      mode: "lecture",
      version: version(workbook.version),
    },
    slides,
  };
  if (new TextEncoder().encode(JSON.stringify(manifest)).byteLength > 64_000)
    throw new LectureManifestError(
      "Serialized lecture manifest may not exceed 64000 UTF-8 bytes.",
    );
  return manifest;
}

export async function createLectureManifestRecord(
  input: unknown,
): Promise<LectureManifestRecord> {
  const manifest = canonicalLectureManifest(input);
  const manifestJson = JSON.stringify(manifest);
  return {
    manifest,
    manifestJson,
    integrityHash: await sha256(manifestJson),
  };
}

export async function parseAndVerifyLectureManifest(
  manifestJson: string,
  expectedHash: string,
): Promise<LectureManifest> {
  if (typeof manifestJson !== "string" || !manifestJson.trim())
    throw new LectureManifestError("Lecture manifest is unavailable.");
  if (new TextEncoder().encode(manifestJson).byteLength > 64_000)
    throw new LectureManifestError("Lecture manifest is too large.");
  if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/.test(expectedHash))
    throw new LectureManifestError("Lecture manifest hash is unavailable.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new LectureManifestError("Lecture manifest JSON is malformed.");
  }
  const manifest = canonicalLectureManifest(parsed);
  const canonicalJson = JSON.stringify(manifest);
  if ((await sha256(canonicalJson)) !== expectedHash)
    throw new LectureManifestError("Lecture manifest integrity check failed.");
  return manifest;
}
