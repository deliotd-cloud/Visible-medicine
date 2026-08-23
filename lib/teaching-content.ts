import { safeText } from "@/lib/domain";

export type TeachingContentBlockType =
  | "text"
  | "key-points"
  | "explanation"
  | "reading-link"
  | "case-image"
  | "scene";

export type TeachingContentBlockDraft = {
  caseId: string;
  type: TeachingContentBlockType;
  title: string;
  body: string;
  url: string;
};

export type TeachingContentBlockView = TeachingContentBlockDraft & {
  id: string;
  workbookId: string;
  position: number;
  version: number;
};

export class TeachingContentValidationError extends Error {}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TeachingContentValidationError("Teaching content block must be an object.");
  return value as Record<string, unknown>;
}

export function validateTeachingContentBlock(
  value: unknown,
): TeachingContentBlockDraft {
  const input = record(value);
  const allowed = ["caseId", "type", "title", "body", "url"];
  const unsupported = Object.keys(input).find((key) => !allowed.includes(key));
  if (unsupported)
    throw new TeachingContentValidationError(
      `Teaching content block contains unsupported field ${unsupported}.`,
    );
  const types = new Set<TeachingContentBlockType>([
    "text",
    "key-points",
    "explanation",
    "reading-link",
    "case-image",
    "scene",
  ]);
  const type = safeText(input.type, 30) as TeachingContentBlockType;
  if (!types.has(type))
    throw new TeachingContentValidationError("Unsupported teaching content block type.");
  const caseId = safeText(input.caseId, 100).trim();
  const title = safeText(input.title, 160).trim();
  const body = safeText(input.body, 2_000).trim();
  const rawUrl = safeText(input.url, 1_000).trim();
  if (!caseId || !title)
    throw new TeachingContentValidationError(
      "Each teaching block requires a linked case and title.",
    );
  if (!body && type !== "reading-link")
    throw new TeachingContentValidationError("Teaching block content is required.");
  let url = "";
  if (type === "reading-link") {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "https:") throw new Error();
      url = parsed.toString();
    } catch {
      throw new TeachingContentValidationError(
        "Reading links must use a valid HTTPS address.",
      );
    }
  } else if (rawUrl) {
    throw new TeachingContentValidationError(
      "Only a reading-link block may contain a URL.",
    );
  }
  return { caseId, type, title, body, url };
}

export function keyPointsFromBody(body: string) {
  return body
    .split(/\r?\n/)
    .map((point) => point.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}
