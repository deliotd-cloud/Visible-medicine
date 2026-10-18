import { workbookCorrectionId, type WorkbookCorrectionMode } from './workbook-correction-contract.ts';

export const WORKBOOK_CORRECTION_LINEAGE_ACTION = 'workbook-correction-lineage' as const;
export type WorkbookCorrectionLineageRequest = {
  action: typeof WORKBOOK_CORRECTION_LINEAGE_ACTION; id: string;
  expectedVersion: number; expectedMode: WorkbookCorrectionMode; expectedStatus: 'draft';
};
export type WorkbookCorrectionLineage = {
  ok: true; action: typeof WORKBOOK_CORRECTION_LINEAGE_ACTION;
  workbookId: string; workbookVersion: number; mode: WorkbookCorrectionMode; status: 'draft';
} & ({outcome: 'verified'; source: {workbookId: string; version: number; hash: string}}
  | {outcome: 'unavailable'; source: null});

function fields(value: unknown, names: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const keys = Reflect.ownKeys(value);
  return keys.length === names.length && keys.every(key => typeof key === 'string' && names.includes(key) &&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'));
}
const version = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
export function parseWorkbookCorrectionLineageRequest(value: unknown, id: string): WorkbookCorrectionLineageRequest | null {
  if (!workbookCorrectionId(id) || !fields(value, ['action','id','expectedVersion','expectedMode','expectedStatus']) ||
    value.action !== WORKBOOK_CORRECTION_LINEAGE_ACTION || value.id !== id || !version(value.expectedVersion) ||
    typeof value.expectedMode !== 'string' || !['teaching','assessment','lecture'].includes(value.expectedMode) ||
    value.expectedStatus !== 'draft') return null;
  return {...value} as WorkbookCorrectionLineageRequest;
}
export function parseWorkbookCorrectionLineage(value: unknown, expected: WorkbookCorrectionLineageRequest): WorkbookCorrectionLineage | null {
  if (!parseWorkbookCorrectionLineageRequest(expected, expected.id) ||
    !fields(value, ['ok','action','workbookId','workbookVersion','mode','status','outcome','source']) ||
    value.ok !== true || value.action !== WORKBOOK_CORRECTION_LINEAGE_ACTION || value.workbookId !== expected.id ||
    value.workbookVersion !== expected.expectedVersion || value.mode !== expected.expectedMode || value.status !== 'draft') return null;
  if (value.outcome === 'unavailable' && value.source === null) return {...value} as WorkbookCorrectionLineage;
  if (value.outcome !== 'verified' || !fields(value.source, ['workbookId','version','hash']) ||
    !workbookCorrectionId(value.source.workbookId) || value.source.workbookId === expected.id ||
    !version(value.source.version) || typeof value.source.hash !== 'string' || !/^[a-f0-9]{64}$/.test(value.source.hash)) return null;
  return {...value, source: {...value.source}} as WorkbookCorrectionLineage;
}
