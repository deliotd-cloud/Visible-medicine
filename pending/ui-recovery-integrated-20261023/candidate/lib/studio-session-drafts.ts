// Same-document recovery only. The owner must be the exact Document used by the caller.
// These entries have no disk lifetime and confer no identity or mutation authority.
export type StudioSessionDraft = Readonly<{
  key: string;
  raw: string;
  baselineKnown: boolean;
  baselineRaw: string | null;
}>;

const MAX_ENTRY_BYTES = 512 * 1024;
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const MAX_DOCUMENT_ENTRIES = 8;
const drafts = new WeakMap<object, Map<string, StudioSessionDraft>>();
const encoder = new TextEncoder();

function validPart(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256 &&
    value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}

function validKey(key: unknown): key is string {
  if (typeof key !== "string") return false;
  try {
    const parts: unknown = JSON.parse(key);
    return Array.isArray(parts) && parts.length === 4 && parts[0] === "v1" &&
      validPart(parts[1]) && parts[1].startsWith("edu:") && validPart(parts[1].slice(4)) &&
      validPart(parts[2]) && validPart(parts[3]) && JSON.stringify(parts) === key;
  } catch {
    return false;
  }
}

function validRaw(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.length === 0 || encoder.encode(raw).byteLength > MAX_ENTRY_BYTES) return false;
  try {
    const fields: unknown = JSON.parse(raw);
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) return false;
    const entries = Object.entries(fields);
    if (entries.length === 0) return false;
    return entries.every(([key, value]) =>
      key !== "__proto__" && key !== "constructor" && key !== "prototype" &&
      (typeof value === "string" ||
        (Array.isArray(value) && value.every((part) => typeof part === "string"))));
  } catch {
    return false;
  }
}

function validBaselineRaw(raw: unknown): raw is string | null {
  // A storage baseline is an exact byte comparison value, including malformed JSON.
  return raw === null || (typeof raw === "string" && encoder.encode(raw).byteLength <= MAX_ENTRY_BYTES);
}

function validOwner(owner: unknown): owner is object {
  return typeof owner === "object" && owner !== null;
}

export function readStudioSessionDraft(owner: object, key: string): StudioSessionDraft | null {
  return validOwner(owner) && validKey(key) ? drafts.get(owner)?.get(key) ?? null : null;
}

export function retainStudioSessionDraft(
  owner: object,
  key: string,
  expected: StudioSessionDraft | null,
  raw: string,
  baseline: { known: boolean; raw: string | null },
): StudioSessionDraft | null {
  if (!validOwner(owner) || !validKey(key) || !validRaw(raw) ||
      !baseline || typeof baseline.known !== "boolean" ||
      !validBaselineRaw(baseline.raw) ||
      (!baseline.known && baseline.raw !== null)) return null;

  const entries = drafts.get(owner);
  const current = entries?.get(key) ?? null;
  if (current !== expected) return null;
  if (!current && entries && entries.size >= MAX_DOCUMENT_ENTRIES) return null;

  const bytes = encoder.encode(raw).byteLength + (baseline.raw === null ? 0 : encoder.encode(baseline.raw).byteLength);
  let otherBytes = 0;
  for (const [otherKey, draft] of entries ?? []) {
    if (otherKey !== key) {
      otherBytes += encoder.encode(draft.raw).byteLength;
      if (draft.baselineRaw !== null) otherBytes += encoder.encode(draft.baselineRaw).byteLength;
    }
  }
  if (otherBytes + bytes > MAX_DOCUMENT_BYTES) return null;

  const next = Object.freeze({ key, raw, baselineKnown: baseline.known, baselineRaw: baseline.raw });
  if (entries) entries.set(key, next);
  else drafts.set(owner, new Map([[key, next]]));
  return next;
}

export function dropStudioSessionDraft(owner: object, key: string, expected: StudioSessionDraft | null): boolean {
  if (!validOwner(owner) || !validKey(key) || expected === null) return false;
  const entries = drafts.get(owner);
  if (!entries || entries.get(key) !== expected) return false;
  entries.delete(key);
  if (entries.size === 0) drafts.delete(owner);
  return true;
}
