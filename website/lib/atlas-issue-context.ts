export type AtlasIssueContext = Readonly<{
  atlas: '3D' | 'CT' | 'MRI';
  region: string;
  sourceRevision: string;
  structure?: Readonly<{ id: string; label: string }>;
}>;

export const UNCONFIRMED_CONTEXT =
  'The current structure or source could not be confirmed. Select it again, then reopen this panel.';

function recordValues(value: unknown, allowed: readonly string[], required: readonly string[]): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.getPrototypeOf(value) !== Object.prototype) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length < required.length || keys.some((key) => typeof key !== 'string' || !allowed.includes(key))) return null;
  if (required.some((key) => !keys.includes(key))) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const result: Record<string, unknown> = Object.create(null);
  for (const key of keys) {
    const descriptor = descriptors[key as string];
    if (!descriptor || !descriptor.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return null;
    result[key as string] = descriptor.value;
  }
  return result;
}

/** Only accepts bounded catalog identifiers. The caller must still verify catalog membership. */
export function validateAtlasIssueContext(value: unknown): AtlasIssueContext | null {
  try {
    const item = recordValues(value, ['atlas', 'region', 'sourceRevision', 'structure'], ['atlas', 'region', 'sourceRevision']);
    if (!item) return null;
    if (item.atlas !== '3D' && item.atlas !== 'CT' && item.atlas !== 'MRI') return null;
    if (typeof item.region !== 'string' || item.region.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.region)) return null;
    if (typeof item.sourceRevision !== 'string' || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(item.sourceRevision)) return null;
    let structure: AtlasIssueContext['structure'];
    if (Object.prototype.hasOwnProperty.call(item, 'structure')) {
      const row = recordValues(item.structure, ['id', 'label'], ['id', 'label']);
      if (!row) return null;
      if (typeof row.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9:_-]{0,239}$/.test(row.id)) return null;
      if (typeof row.label !== 'string' || !row.label || row.label.length > 240 || row.label.trim() !== row.label ||
        /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069]/u.test(row.label)) return null;
      structure = { id: row.id, label: row.label };
    }
    return { atlas: item.atlas, region: item.region, sourceRevision: item.sourceRevision, ...(structure ? { structure } : {}) };
  } catch {
    return null;
  }
}

export function sameAtlasIssueContext(left: AtlasIssueContext | null, right: AtlasIssueContext | null): boolean {
  return !!left && !!right && left.atlas === right.atlas && left.region === right.region &&
    left.sourceRevision === right.sourceRevision && left.structure?.id === right.structure?.id &&
    left.structure?.label === right.structure?.label;
}

export function formatAtlasIssueDetails(value: unknown): string | null {
  const context = validateAtlasIssueContext(value);
  if (!context) return null;
  return [
    'Visible Medicine Atlas problem details',
    `Atlas: ${context.atlas}`,
    `Region: ${context.region}`,
    `Source revision: ${context.sourceRevision}`,
    ...(context.structure ? [`Structure: ${context.structure.label} (${context.structure.id})`] : []),
    '',
    'When contacting Visible Medicine, add:',
    'What happened:',
    'What you expected:',
  ].join('\n');
}
