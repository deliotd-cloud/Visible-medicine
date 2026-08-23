import { safeText } from "@/lib/domain";

export type PollSelectionMode = "single" | "multiple";
export type PollOption = { id: string; label: string };
export type PollDraft = {
  caseId: string;
  prompt: string;
  selectionMode: PollSelectionMode;
  options: PollOption[];
  correctOptionIds: string[];
  explanation: string;
};

export type TeachingPollView = {
  id: string;
  workbookId: string;
  caseId: string;
  prompt: string;
  selectionMode: PollSelectionMode;
  options: PollOption[];
  correctOptionIds: string[];
  explanation: string;
  position: number;
  version: number;
  run: null | {
    id: string;
    state: "open" | "closed";
    version: number;
    resultsRevealed: boolean;
    responseCount: number;
    openedAt: string;
    closedAt: string | null;
    results: Array<{ optionId: string; count: number; percentage: number }> | null;
  };
  ownResponse: null | { selections: string[]; revision: number; respondedAt: string };
};

export class TeachingPollValidationError extends Error {}

export function canControlOwnedTeachingResource(
  roles: readonly string[],
  actorId: string,
  ownerId: string,
) {
  return (
    roles.includes("administrator") ||
    (roles.includes("instructor") && actorId === ownerId)
  );
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TeachingPollValidationError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  const unsupported = Object.keys(value).find((key) => !allowed.includes(key));
  if (unsupported) throw new TeachingPollValidationError(`${label} contains unsupported field ${unsupported}.`);
}

export function validatePollDraft(value: unknown): PollDraft {
  const input = record(value, "poll");
  exactKeys(input, ["caseId", "prompt", "selectionMode", "options", "correctOptionIndexes", "explanation"], "poll");
  const caseId = safeText(input.caseId, 100).trim();
  const prompt = safeText(input.prompt, 500).trim();
  const explanation = safeText(input.explanation, 1_500).trim();
  const selectionMode = input.selectionMode === "multiple" ? "multiple" : input.selectionMode === "single" ? "single" : null;
  if (!caseId) throw new TeachingPollValidationError("A poll must be linked to a teaching case.");
  if (!prompt) throw new TeachingPollValidationError("A poll question is required.");
  if (!selectionMode) throw new TeachingPollValidationError("Poll selectionMode must be single or multiple.");
  if (!Array.isArray(input.options) || input.options.length < 2 || input.options.length > 8) throw new TeachingPollValidationError("A poll must contain between two and eight choices.");
  const labels = input.options.map((option) => safeText(option, 240).trim());
  if (labels.some((label) => !label)) throw new TeachingPollValidationError("Every poll choice requires text.");
  if (new Set(labels.map((label) => label.toLocaleLowerCase())).size !== labels.length) throw new TeachingPollValidationError("Poll choices must be unique.");
  if (!Array.isArray(input.correctOptionIndexes) || input.correctOptionIndexes.some((index) => !Number.isInteger(index) || Number(index) < 0 || Number(index) >= labels.length)) throw new TeachingPollValidationError("Correct poll choices are invalid.");
  const correctIndexes = [...new Set(input.correctOptionIndexes.map(Number))];
  if (!correctIndexes.length)
    throw new TeachingPollValidationError(
      "A teaching poll requires at least one correct choice.",
    );
  if (selectionMode === "single" && correctIndexes.length > 1) throw new TeachingPollValidationError("A single-choice poll can have at most one correct choice.");
  const options = labels.map((label, index) => ({ id: `option-${index + 1}`, label }));
  return { caseId, prompt, selectionMode, options, correctOptionIds: correctIndexes.map((index) => options[index].id), explanation };
}

export function validatePollSelection(value: unknown, selectionMode: PollSelectionMode, options: readonly PollOption[]) {
  if (!Array.isArray(value) || !value.length) throw new TeachingPollValidationError("Select at least one poll choice.");
  if (value.some((item) => typeof item !== "string")) throw new TeachingPollValidationError("Poll selections must be choice identifiers.");
  const selections = [...new Set(value as string[])];
  const allowed = new Set(options.map((option) => option.id));
  if (selections.some((selection) => !allowed.has(selection))) throw new TeachingPollValidationError("A poll selection is not part of this question.");
  if (selectionMode === "single" && selections.length !== 1) throw new TeachingPollValidationError("Choose exactly one response for this poll.");
  if (selectionMode === "multiple" && selections.length > options.length) throw new TeachingPollValidationError("Too many poll choices were selected.");
  return selections.sort();
}

export function aggregatePollResponses(options: readonly PollOption[], responses: readonly string[][]) {
  const counts = new Map(options.map((option) => [option.id, 0]));
  for (const response of responses) for (const optionId of new Set(response)) if (counts.has(optionId)) counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
  const denominator = responses.length;
  return options.map((option) => ({ optionId: option.id, count: counts.get(option.id) ?? 0, percentage: denominator ? Math.round(((counts.get(option.id) ?? 0) / denominator) * 100) : 0 }));
}

export function canManageTeachingPolls(roles: readonly string[]) { return roles.includes("instructor") || roles.includes("administrator"); }
export function canAnswerTeachingPolls(roles: readonly string[]) { return roles.includes("learner"); }
export function canSeeTeachingPollResults(roles: readonly string[], resultsRevealed: boolean) { return canManageTeachingPolls(roles) || resultsRevealed; }
