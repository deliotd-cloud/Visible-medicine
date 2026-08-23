export const CLASSIFICATIONS = ["radiology", "pathology", "mixed", "unsupported", "requires-review"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export type ContentSignal = {
  kind: "radiology" | "pathology" | "unknown";
  format: string;
  supported: boolean;
  integrityValid: boolean;
  deidentified: boolean;
  publicationCleared: boolean;
  metadataConflict?: boolean;
};

export type ClassificationResult = { classification: Classification; reasonCodes: string[]; publishable: boolean };

const RADIOLOGY_TOOLS = ["window-level", "zoom", "pan", "cine", "measure", "annotate", "layouts", "crosshair"];
const PATHOLOGY_TOOLS = ["zoom", "pan", "measure", "annotate", "layouts", "overview"];

export function classifyTeachingContent(signals: ContentSignal[]): ClassificationResult {
  if (signals.length === 0) return { classification: "requires-review", reasonCodes: ["NO_CONTENT"], publishable: false };
  if (signals.some((signal) => !signal.integrityValid || signal.metadataConflict)) return { classification: "requires-review", reasonCodes: ["INTEGRITY_OR_METADATA_CONFLICT"], publishable: false };
  if (signals.some((signal) => !signal.supported)) return { classification: "unsupported", reasonCodes: ["UNSUPPORTED_MEDIA_PROFILE"], publishable: false };
  if (signals.some((signal) => signal.kind === "unknown")) return { classification: "requires-review", reasonCodes: ["UNRECOGNIZED_CONTENT_TYPE"], publishable: false };
  if (signals.some((signal) => !signal.deidentified)) return { classification: "requires-review", reasonCodes: ["DEIDENTIFICATION_NOT_CONFIRMED"], publishable: false };
  if (signals.some((signal) => !signal.publicationCleared)) return { classification: "requires-review", reasonCodes: ["PUBLICATION_CLEARANCE_MISSING"], publishable: false };
  const kinds = new Set(signals.map((signal) => signal.kind));
  if (kinds.size > 1) return { classification: "mixed", reasonCodes: ["RADIOLOGY_AND_PATHOLOGY_PRESENT", "HUMAN_MIXED_CASE_REVIEW_REQUIRED"], publishable: false };
  const classification = signals[0].kind as "radiology" | "pathology";
  return { classification, reasonCodes: [classification === "radiology" ? "SUPPORTED_RADIOLOGY_PROFILE" : "SUPPORTED_PATHOLOGY_PROFILE"], publishable: true };
}

export function allowedTools(classification: Classification): string[] {
  if (classification === "radiology") return [...RADIOLOGY_TOOLS];
  if (classification === "pathology") return [...PATHOLOGY_TOOLS];
  if (classification === "mixed") return [...new Set([...RADIOLOGY_TOOLS, ...PATHOLOGY_TOOLS, "asset-switch"])];
  return [];
}

const ATTEMPT_TRANSITIONS: Record<string, string[]> = {
  assigned: ["in-progress", "voided"], "in-progress": ["submitted", "expired", "voided"], submitted: ["accepted-for-marking", "reopened", "voided"], "accepted-for-marking": ["marked", "reopened", "voided"], marked: ["moderated", "reopened"], moderated: ["approved"], approved: ["released"], released: [], expired: ["reopened", "voided"], reopened: ["submitted", "voided"], voided: [],
};

export function canTransitionAttempt(from: string, to: string): boolean { return ATTEMPT_TRANSITIONS[from]?.includes(to) ?? false; }
export function outcomeFor(score: number, maxScore: number): "Pass" | "Borderline" | "Not passed" { if (maxScore <= 0) return "Not passed"; const value = (score / maxScore) * 100; return value >= 60 ? "Pass" : value >= 50 ? "Borderline" : "Not passed"; }
export function safeText(value: unknown, maxLength = 20_000): string { return typeof value === "string" ? value.replace(/\0/g, "").slice(0, maxLength) : ""; }
export async function sha256(value: string): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
