import { safeText } from "@/lib/domain";

export type QuestionResponseType =
  | "long-text"
  | "single-choice"
  | "multiple-choice";
export type QuestionDifficulty = "foundation" | "intermediate" | "advanced";
export type QuestionModality = "radiology" | "pathology" | "mixed";

export type QuestionBankDraft = {
  title: string;
  prompt: string;
  responseType: QuestionResponseType;
  maxMarks: number;
  modality: QuestionModality;
  difficulty: QuestionDifficulty;
  tags: string[];
  options: string[];
  correctOptionIndexes: number[];
  rationale: string;
};

export type QuestionBankItem = QuestionBankDraft & {
  id: string;
  status: "active" | "archived";
  version: number;
  createdAt: string;
  updatedAt: string;
};

export class QuestionBankValidationError extends Error {}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new QuestionBankValidationError("Question bank item must be an object.");
  return value as Record<string, unknown>;
}

export function validateQuestionBankDraft(value: unknown): QuestionBankDraft {
  const input = object(value);
  const allowed = [
    "title",
    "prompt",
    "responseType",
    "maxMarks",
    "modality",
    "difficulty",
    "tags",
    "options",
    "correctOptionIndexes",
    "rationale",
  ];
  const unsupported = Object.keys(input).find((key) => !allowed.includes(key));
  if (unsupported)
    throw new QuestionBankValidationError(
      `Question bank item contains unsupported field ${unsupported}.`,
    );
  const title = safeText(input.title, 160).trim();
  const prompt = safeText(input.prompt, 2_000).trim();
  const responseType = safeText(input.responseType, 30) as QuestionResponseType;
  const modality = safeText(input.modality, 30) as QuestionModality;
  const difficulty = safeText(input.difficulty, 30) as QuestionDifficulty;
  const maxMarks = Number(input.maxMarks);
  const rationale = safeText(input.rationale, 2_000).trim();
  if (!title || !prompt)
    throw new QuestionBankValidationError("A title and prompt are required.");
  if (!["long-text", "single-choice", "multiple-choice"].includes(responseType))
    throw new QuestionBankValidationError("Unsupported response type.");
  if (!["radiology", "pathology", "mixed"].includes(modality))
    throw new QuestionBankValidationError("Unsupported question modality.");
  if (!["foundation", "intermediate", "advanced"].includes(difficulty))
    throw new QuestionBankValidationError("Unsupported question difficulty.");
  if (!Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 100)
    throw new QuestionBankValidationError("Maximum marks must be from 1 to 100.");
  if (!Array.isArray(input.tags) || input.tags.length > 12)
    throw new QuestionBankValidationError("Provide no more than 12 tags.");
  const tags = input.tags
    .map((tag) => safeText(tag, 40).trim().toLocaleLowerCase())
    .filter(Boolean);
  if (new Set(tags).size !== tags.length)
    throw new QuestionBankValidationError("Question tags must be unique.");
  if (!Array.isArray(input.options) || input.options.length > 8)
    throw new QuestionBankValidationError("Provide no more than 8 answer options.");
  const options = input.options.map((option) => safeText(option, 400).trim());
  if (responseType === "long-text" && options.length)
    throw new QuestionBankValidationError("Long-text questions cannot contain options.");
  if (responseType !== "long-text") {
    if (options.length < 2 || options.some((option) => !option))
      throw new QuestionBankValidationError(
        "Choice questions require at least two complete options.",
      );
    if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length)
      throw new QuestionBankValidationError("Answer options must be unique.");
  }
  if (
    !Array.isArray(input.correctOptionIndexes) ||
    input.correctOptionIndexes.some(
      (index) => !Number.isInteger(index) || Number(index) < 0 || Number(index) >= options.length,
    )
  )
    throw new QuestionBankValidationError("Correct answer indexes are invalid.");
  const correctOptionIndexes = [...new Set(input.correctOptionIndexes.map(Number))];
  if (responseType !== "long-text" && correctOptionIndexes.length === 0)
    throw new QuestionBankValidationError(
      "Choice questions require at least one correct answer.",
    );
  if (responseType === "single-choice" && correctOptionIndexes.length > 1)
    throw new QuestionBankValidationError("Choose-one questions can have one answer.");
  if (responseType === "long-text" && correctOptionIndexes.length)
    throw new QuestionBankValidationError("Long-text questions cannot have answer indexes.");
  return {
    title,
    prompt,
    responseType,
    maxMarks,
    modality,
    difficulty,
    tags,
    options,
    correctOptionIndexes,
    rationale,
  };
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xmlDecode(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

export function exportQuestionBankQti(items: QuestionBankItem[]) {
  const assessmentItems = items.map((item) => {
    const cardinality = item.responseType === "multiple-choice" ? "multiple" : "single";
    const declaration =
      item.responseType === "long-text"
        ? ""
        : `<qti-response-declaration identifier="RESPONSE" cardinality="${cardinality}" base-type="identifier"><qti-correct-response>${item.correctOptionIndexes.map((index) => `<qti-value>CHOICE_${index + 1}</qti-value>`).join("")}</qti-correct-response></qti-response-declaration>`;
    const interaction =
      item.responseType === "long-text"
        ? '<qti-extended-text-interaction response-identifier="RESPONSE"/>'
        : `<qti-choice-interaction response-identifier="RESPONSE" max-choices="${item.responseType === "single-choice" ? 1 : item.options.length}">${item.options.map((option, index) => `<qti-simple-choice identifier="CHOICE_${index + 1}">${xmlEscape(option)}</qti-simple-choice>`).join("")}</qti-choice-interaction>`;
    return `<qti-assessment-item identifier="${xmlEscape(item.id)}" title="${xmlEscape(item.title)}" adaptive="false" time-dependent="false" data-modality="${item.modality}" data-difficulty="${item.difficulty}" data-max-marks="${item.maxMarks}" data-tags="${xmlEscape(item.tags.join(","))}" data-response-type="${item.responseType}">${declaration}<qti-item-body><qti-p>${xmlEscape(item.prompt)}</qti-p>${interaction}</qti-item-body><qti-modal-feedback outcome-identifier="FEEDBACK" identifier="RATIONALE" show-hide="show">${xmlEscape(item.rationale)}</qti-modal-feedback></qti-assessment-item>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="visible-medicine-question-bank" title="Visible Medicine question bank">${assessmentItems.join("")}</qti-assessment-test>`;
}

function attribute(source: string, name: string) {
  const match = source.match(new RegExp(`\\s${name}="([^"]*)"`, "i"));
  return match ? xmlDecode(match[1]) : "";
}

export function importQuestionBankQti(xmlValue: unknown): QuestionBankDraft[] {
  const xml = safeText(xmlValue, 128_000);
  if (!xml.trim())
    throw new QuestionBankValidationError("QTI XML is required.");
  if (/<!DOCTYPE|<!ENTITY|<script|xlink:href|schemaLocation/i.test(xml))
    throw new QuestionBankValidationError(
      "QTI contains a prohibited external or executable declaration.",
    );
  const items = [
    ...xml.matchAll(
      /<qti-assessment-item\b([^>]*)>([\s\S]*?)<\/qti-assessment-item>/gi,
    ),
  ];
  if (!items.length || items.length > 100)
    throw new QuestionBankValidationError(
      "QTI must contain between 1 and 100 assessment items.",
    );
  return items.map((match) => {
    const attrs = match[1];
    const body = match[2];
    const prompt = xmlDecode(
      body.match(/<qti-p\b[^>]*>([\s\S]*?)<\/qti-p>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "",
    );
    const options = [
      ...body.matchAll(
        /<qti-simple-choice\b[^>]*>([\s\S]*?)<\/qti-simple-choice>/gi,
      ),
    ].map((choice) => xmlDecode(choice[1].replace(/<[^>]+>/g, "").trim()));
    const correctOptionIndexes = [
      ...body.matchAll(/<qti-value>CHOICE_(\d+)<\/qti-value>/gi),
    ].map((value) => Number(value[1]) - 1);
    const responseType =
      (attribute(attrs, "data-response-type") as QuestionResponseType) ||
      (options.length
        ? attribute(body, "max-choices") === "1"
          ? "single-choice"
          : "multiple-choice"
        : "long-text");
    const rationale = xmlDecode(
      body.match(/<qti-modal-feedback\b[^>]*>([\s\S]*?)<\/qti-modal-feedback>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "",
    );
    return validateQuestionBankDraft({
      title: attribute(attrs, "title"),
      prompt,
      responseType,
      maxMarks: Number(attribute(attrs, "data-max-marks") || 1),
      modality: attribute(attrs, "data-modality") || "mixed",
      difficulty: attribute(attrs, "data-difficulty") || "intermediate",
      tags: attribute(attrs, "data-tags").split(",").filter(Boolean),
      options,
      correctOptionIndexes,
      rationale,
    });
  });
}
