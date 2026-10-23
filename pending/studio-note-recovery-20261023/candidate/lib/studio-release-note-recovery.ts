// Ephemeral recovery for unsent release notes. Callers pass the current Document
// and must independently revalidate identity, binding, and mutation context.
export type Entry = Readonly<{ key: string; notes: string; uncertain: boolean }>;

const MAX_ENTRIES = 8;
const MAX_NOTES_LENGTH = 2000; // UTF-16 code units, matching the form field.
const MAX_DOCUMENT_BYTES = 128 * 1024;
const entriesByDocument = new WeakMap<object, Map<string, Entry>>();
const encoder = new TextEncoder();

function validPart(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength &&
    value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}

function validScope(scope: unknown): scope is { actorId: string; organizationId: string } {
  if (!scope || typeof scope !== "object") return false;
  const candidate = scope as Record<string, unknown>;
  return validPart(candidate.actorId, 256) && candidate.actorId.startsWith("edu:") &&
    validPart(candidate.actorId.slice(4), 252) && validPart(candidate.organizationId, 256);
}

function validBinding(parts: unknown): parts is [string, number, string, string, boolean, boolean] {
  if (!Array.isArray(parts) || parts.length !== 6) return false;
  const [id, version, status, revision, canPublish, approvalCurrent] = parts;
  return validPart(id, 200) && typeof version === "number" && Number.isSafeInteger(version) && version > 0 &&
    (status === "in-review" || status === "approved" && approvalCurrent === false) &&
    typeof revision === "string" && /^[a-f0-9]{64}$/.test(revision) &&
    typeof canPublish === "boolean" && typeof approvalCurrent === "boolean";
}

export function releaseNoteRecoveryKey(
  scope: { actorId: string; organizationId: string } | undefined,
  binding: string,
): string | null {
  if (!validScope(scope) || typeof binding !== "string") return null;
  try {
    const parts: unknown = JSON.parse(binding);
    if (!validBinding(parts) || JSON.stringify(parts) !== binding) return null;
    return JSON.stringify(["studio-release-notes-v1", scope.actorId, scope.organizationId, ...parts]);
  } catch {
    return null;
  }
}

function validKey(key: unknown): key is string {
  if (typeof key !== "string") return false;
  try {
    const parts: unknown = JSON.parse(key);
    if (!Array.isArray(parts) || parts.length !== 9 || parts[0] !== "studio-release-notes-v1") return false;
    const scope = { actorId: parts[1], organizationId: parts[2] };
    return releaseNoteRecoveryKey(scope, JSON.stringify(parts.slice(3))) === key;
  } catch {
    return false;
  }
}

function validOwner(owner: unknown): owner is object {
  return typeof owner === "object" && owner !== null;
}

function entryBytes(entry: Entry): number {
  return encoder.encode(entry.key).byteLength + encoder.encode(entry.notes).byteLength;
}

export function readUnsentReleaseNotes(owner: object, key: string): Entry | null {
  return validOwner(owner) && validKey(key) ? entriesByDocument.get(owner)?.get(key) ?? null : null;
}

export function retainUnsentReleaseNotes(
  owner: object,
  key: string,
  expected: Entry | null,
  notes: string,
  uncertain: boolean,
): Entry | null {
  if (!validOwner(owner) || !validKey(key) || typeof notes !== "string" ||
      notes.length > MAX_NOTES_LENGTH || notes.length === 0 && uncertain !== true ||
      typeof uncertain !== "boolean") return null;

  const entries = entriesByDocument.get(owner);
  const current = entries?.get(key) ?? null;
  if (current !== expected || !current && entries && entries.size >= MAX_ENTRIES) return null;

  const next: Entry = Object.freeze({ key, notes, uncertain });
  let totalBytes = entryBytes(next);
  for (const [otherKey, entry] of entries ?? []) {
    if (otherKey !== key) totalBytes += entryBytes(entry);
  }
  if (totalBytes > MAX_DOCUMENT_BYTES) return null;

  if (entries) entries.set(key, next);
  else entriesByDocument.set(owner, new Map([[key, next]]));
  return next;
}

export function dropUnsentReleaseNotes(owner: object, key: string, expected: Entry | null): boolean {
  if (!validOwner(owner) || !validKey(key) || expected === null) return false;
  const entries = entriesByDocument.get(owner);
  if (!entries || entries.get(key) !== expected) return false;
  entries.delete(key);
  if (entries.size === 0) entriesByDocument.delete(owner);
  return true;
}
