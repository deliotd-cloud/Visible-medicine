export const MAX_LECTURE_SLIDES = 80;
export const MAX_LECTURE_SLIDES_BYTES = 48_000;

export type LectureSlide = {
  id: string;
  title: string;
  body: string;
  referenceUrl: string;
};

export class LectureContentError extends Error {
  readonly code = "LECTURE_CONTENT_INVALID";
}

type JsonObject = Record<string, unknown>;

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new LectureContentError(`${label} must be an object.`);
  return value as JsonObject;
}

function exactKeys(value: JsonObject, expected: readonly string[], label: string) {
  const actual = Object.keys(value).sort();
  const allowed = [...expected].sort();
  if (
    actual.length !== allowed.length ||
    actual.some((key, index) => key !== allowed[index])
  )
    throw new LectureContentError(`${label} has an unsupported shape.`);
}

function text(value: unknown, label: string, maximum: number, allowEmpty = false) {
  if (typeof value !== "string")
    throw new LectureContentError(`${label} must be text.`);
  if (
    value.length > maximum ||
    value.includes("\0") ||
    value !== value.trim() ||
    (!allowEmpty && !value)
  )
    throw new LectureContentError(`${label} is empty, malformed, or too long.`);
  return value;
}

function identifier(value: unknown, label: string) {
  const parsed = text(value, label, 100);
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,99})$/.test(parsed))
    throw new LectureContentError(`${label} must be a simple identifier.`);
  return parsed;
}

function referenceUrl(value: unknown, label: string) {
  const parsed = text(value, label, 1_000, true);
  if (!parsed) return parsed;
  let url: URL;
  try {
    url = new URL(parsed);
  } catch {
    throw new LectureContentError(`${label} must be an HTTPS URL.`);
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password)
    throw new LectureContentError(
      `${label} must be an HTTPS URL without credentials.`,
    );
  return parsed;
}

function serializedBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function validateLectureSlides(
  input: unknown,
  { allowEmpty = false, allowIncomplete = false }: { allowEmpty?: boolean; allowIncomplete?: boolean } = {},
): LectureSlide[] {
  if (!Array.isArray(input))
    throw new LectureContentError("Lecture slides must be an array.");
  if (!input.length && !allowEmpty)
    throw new LectureContentError("A lecture must contain at least one slide.");
  if (input.length > MAX_LECTURE_SLIDES)
    throw new LectureContentError(
      `A lecture may contain at most ${MAX_LECTURE_SLIDES} slides.`,
    );

  const identifiers = new Set<string>();
  const slides = input.map((entry, index) => {
    const label = `Lecture slide ${index + 1}`;
    const item = object(entry, label);
    exactKeys(item, ["id", "title", "body", "referenceUrl"], label);
    const id = identifier(item.id, `${label} identifier`);
    if (identifiers.has(id))
      throw new LectureContentError("Lecture slide identifiers must be unique.");
    identifiers.add(id);
    return {
      id,
      title: text(item.title, `${label} title`, 160, allowIncomplete),
      body: text(item.body, `${label} body`, 5_000, allowIncomplete),
      referenceUrl: referenceUrl(item.referenceUrl, `${label} reference URL`),
    };
  });

  if (serializedBytes(slides) > MAX_LECTURE_SLIDES_BYTES)
    throw new LectureContentError(
      `Serialized lecture slides may not exceed ${MAX_LECTURE_SLIDES_BYTES} UTF-8 bytes.`,
    );
  return slides;
}
