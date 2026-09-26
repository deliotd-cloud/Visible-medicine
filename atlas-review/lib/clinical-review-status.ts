/** Summary only. No reviewer names, evidence or notes belong in this response. */
export const clinicalStatusLabels = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  'changes-required': 'Changes required',
  'approval-recorded': 'Approval recorded',
  're-review': 'Re-review required',
  unavailable: 'Status unavailable',
} as const;
export type ClinicalStatus = keyof typeof clinicalStatusLabels;
export type ClinicalStatusItem = { key: string; geometry: ClinicalStatus; teaching: ClinicalStatus };
export function parseClinicalStatusPage(value: unknown, keys: readonly string[]): ClinicalStatusItem[] {
  if (!value || typeof value !== 'object') throw Error('Invalid review status response');
  const page = value as Record<string, unknown>;
  if (page.scope !== 'private-to-signed-in-user' || !Array.isArray(page.items) || page.items.length !== keys.length)
    throw Error('Review status scope mismatch');
  return page.items.map((item: unknown, index) => {
    if (!item || typeof item !== 'object') throw Error('Invalid review status');
    const row = item as Record<string, unknown>;
    if (row.key !== keys[index] || typeof row.geometry !== 'string' || typeof row.teaching !== 'string'
      || !Object.hasOwn(clinicalStatusLabels, row.geometry) || !Object.hasOwn(clinicalStatusLabels, row.teaching))
      throw Error('Review status selection mismatch');
    return { key: keys[index], geometry: row.geometry as ClinicalStatus, teaching: row.teaching as ClinicalStatus };
  });
}
