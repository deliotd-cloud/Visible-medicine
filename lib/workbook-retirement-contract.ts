export const WORKBOOK_RETIREMENT_ACTION = 'retire-published-workbook' as const;
export type WorkbookRetirementDisposition = 'archived' | 'withdrawn';
export type WorkbookRetirementRequest = {
  action: typeof WORKBOOK_RETIREMENT_ACTION; id: string; expectedVersion: number;
  expectedStatus: 'published'; disposition: WorkbookRetirementDisposition;
  reason: string; confirmed: true;
};
export type WorkbookRetirementReceipt = {
  ok: true; action: typeof WORKBOOK_RETIREMENT_ACTION; workbookId: string;
  workbookVersion: number; disposition: WorkbookRetirementDisposition;
  auditId: string; auditHash: string; retiredAt: string;
};
export function workbookRetirementId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9:_-]{0,99}$/.test(value);
}
function fields(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const names = Reflect.ownKeys(value);
  return names.length === keys.length && names.every(key => typeof key === 'string' && keys.includes(key) &&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'));
}
export function parseWorkbookRetirementRequest(value: unknown, id: string): WorkbookRetirementRequest | null {
  if (!workbookRetirementId(id) || !fields(value, ['action','id','expectedVersion','expectedStatus','disposition','reason','confirmed']) ||
      value.action !== WORKBOOK_RETIREMENT_ACTION || value.id !== id || value.expectedStatus !== 'published' ||
      typeof value.expectedVersion !== 'number' || !Number.isSafeInteger(value.expectedVersion) || value.expectedVersion < 1 ||
      typeof value.disposition !== 'string' || !['archived','withdrawn'].includes(value.disposition) || value.confirmed !== true ||
      typeof value.reason !== 'string' || !value.reason.trim() || value.reason.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value.reason)) return null;
  return {action:WORKBOOK_RETIREMENT_ACTION,id,expectedVersion:value.expectedVersion,expectedStatus:'published',
    disposition:value.disposition as WorkbookRetirementDisposition,reason:value.reason.trim(),confirmed:true};
}
export function parseWorkbookRetirementReceipt(value: unknown, expected: Pick<WorkbookRetirementRequest,'id'|'expectedVersion'|'disposition'>): WorkbookRetirementReceipt | null {
  if (!fields(value,['ok','action','workbookId','workbookVersion','disposition','auditId','auditHash','retiredAt']) ||
      value.ok !== true || value.action !== WORKBOOK_RETIREMENT_ACTION || value.workbookId !== expected.id ||
      value.workbookVersion !== expected.expectedVersion || value.disposition !== expected.disposition ||
      typeof value.auditId !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value.auditId) ||
      typeof value.auditHash !== 'string' || !/^[a-f0-9]{64}$/.test(value.auditHash) ||
      typeof value.retiredAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.retiredAt)) return null;
  const timestamp = Date.parse(value.retiredAt);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value.retiredAt) return null;
  return {...value} as WorkbookRetirementReceipt;
}
