export const WORKBOOK_CORRECTION_ACTION = 'create-workbook-correction' as const;
export const WORKBOOK_CORRECTION_SOURCE_ACTION = 'workbook-correction-source' as const;
export const WORKBOOK_CORRECTION_LOOKUP_ACTION = 'lookup-workbook-correction' as const;
export type WorkbookCorrectionMode = 'teaching' | 'assessment' | 'lecture';
export type WorkbookCorrectionSource = {
  ok: true; action: typeof WORKBOOK_CORRECTION_SOURCE_ACTION;
  workbookId: string; workbookVersion: number; mode: WorkbookCorrectionMode; sourceHash: string;
};
export type WorkbookCorrectionRequest = {
  action: typeof WORKBOOK_CORRECTION_ACTION; id: string; expectedVersion: number;
  expectedStatus: 'published'; expectedMode: WorkbookCorrectionMode; expectedSourceHash: string;
  reason: string; confirmed: true; requestId: string;
};
export type WorkbookCorrectionReceipt = {
  ok: true; action: typeof WORKBOOK_CORRECTION_ACTION; requestId: string;
  sourceWorkbookId: string; sourceVersion: number; sourceHash: string; mode: WorkbookCorrectionMode;
  draftWorkbookId: string; draftVersion: 1; draftStatus: 'draft';
  auditId: string; auditHash: string; createdAt: string;
};
export type WorkbookCorrectionIdentity = Pick<WorkbookCorrectionRequest,
  'id' | 'expectedVersion' | 'expectedMode' | 'expectedSourceHash' | 'requestId'>;
export type WorkbookCorrectionLookupRequest = WorkbookCorrectionIdentity & {
  action: typeof WORKBOOK_CORRECTION_LOOKUP_ACTION;
};
export type WorkbookCorrectionLookup = {
  ok: true; action: typeof WORKBOOK_CORRECTION_LOOKUP_ACTION; requestId: string;
  sourceWorkbookId: string; sourceVersion: number; sourceHash: string; mode: WorkbookCorrectionMode;
} & ({outcome: 'confirmed'; receipt: WorkbookCorrectionReceipt} | {outcome: 'unconfirmed'; receipt: null});
export class WorkbookCorrectionError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = 'WorkbookCorrectionError'; }
}
export function workbookCorrectionId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9:_-]{0,139}$/.test(value);
}
function fields(value: unknown, names: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === names.length && keys.every(key => typeof key === 'string' && names.includes(key) &&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'));
}
const mode = (value: unknown): value is WorkbookCorrectionMode => typeof value === 'string' && ['teaching','assessment','lecture'].includes(value);
const version = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const hash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);

export function parseWorkbookCorrectionSource(value: unknown, expected: {id: string; version: number; mode: WorkbookCorrectionMode}): WorkbookCorrectionSource | null {
  if (!fields(value, ['ok','action','workbookId','workbookVersion','mode','sourceHash']) || value.ok !== true ||
    value.action !== WORKBOOK_CORRECTION_SOURCE_ACTION || !workbookCorrectionId(value.workbookId) ||
    !version(value.workbookVersion) || !mode(value.mode) || !hash(value.sourceHash) ||
    value.workbookId !== expected.id || value.workbookVersion !== expected.version || value.mode !== expected.mode) return null;
  return {...value} as WorkbookCorrectionSource;
}
export function parseWorkbookCorrectionRequest(value: unknown, id: string): WorkbookCorrectionRequest | null {
  if (!workbookCorrectionId(id) || !fields(value, ['action','id','expectedVersion','expectedStatus','expectedMode','expectedSourceHash','reason','confirmed','requestId']) ||
    value.action !== WORKBOOK_CORRECTION_ACTION || value.id !== id || !version(value.expectedVersion) ||
    value.expectedStatus !== 'published' || !mode(value.expectedMode) || !hash(value.expectedSourceHash) ||
    value.confirmed !== true || !uuid(value.requestId) || typeof value.reason !== 'string' ||
    !value.reason.trim() || value.reason.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value.reason)) return null;
  return {...value, reason:value.reason.trim()} as WorkbookCorrectionRequest;
}
export function parseWorkbookCorrectionReceipt(value: unknown, expected: WorkbookCorrectionIdentity): WorkbookCorrectionReceipt | null {
  if (!fields(value, ['ok','action','requestId','sourceWorkbookId','sourceVersion','sourceHash','mode','draftWorkbookId','draftVersion','draftStatus','auditId','auditHash','createdAt']) ||
    value.ok !== true || value.action !== WORKBOOK_CORRECTION_ACTION || value.requestId !== expected.requestId ||
    value.sourceWorkbookId !== expected.id || value.sourceVersion !== expected.expectedVersion ||
    value.sourceHash !== expected.expectedSourceHash || value.mode !== expected.expectedMode ||
    !uuid(value.draftWorkbookId) || value.draftWorkbookId === expected.id || value.draftVersion !== 1 || value.draftStatus !== 'draft' ||
    value.auditId !== expected.requestId || !hash(value.auditHash) || typeof value.createdAt !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.createdAt)) return null;
  const time = Date.parse(value.createdAt);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== value.createdAt) return null;
  return {...value} as WorkbookCorrectionReceipt;
}

export function parseWorkbookCorrectionLookupRequest(value: unknown, id: string): WorkbookCorrectionLookupRequest | null {
  if (!workbookCorrectionId(id) || !fields(value,['action','id','expectedVersion','expectedMode','expectedSourceHash','requestId']) ||
    value.action !== WORKBOOK_CORRECTION_LOOKUP_ACTION || value.id !== id || !version(value.expectedVersion) ||
    !mode(value.expectedMode) || !hash(value.expectedSourceHash) || !uuid(value.requestId)) return null;
  return {...value} as WorkbookCorrectionLookupRequest;
}
export function parseWorkbookCorrectionLookup(value: unknown, expected: WorkbookCorrectionIdentity): WorkbookCorrectionLookup | null {
  if (!fields(value,['ok','action','requestId','sourceWorkbookId','sourceVersion','sourceHash','mode','outcome','receipt']) ||
    value.ok !== true || value.action !== WORKBOOK_CORRECTION_LOOKUP_ACTION || value.requestId !== expected.requestId ||
    value.sourceWorkbookId !== expected.id || value.sourceVersion !== expected.expectedVersion ||
    value.sourceHash !== expected.expectedSourceHash || value.mode !== expected.expectedMode) return null;
  if (value.outcome === 'unconfirmed' && value.receipt === null) return {...value} as WorkbookCorrectionLookup;
  const receipt = value.outcome === 'confirmed' ? parseWorkbookCorrectionReceipt(value.receipt,expected) : null;
  return receipt ? {...value,receipt} as WorkbookCorrectionLookup : null;
}
