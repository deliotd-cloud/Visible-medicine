import {HEAD_MANIFEST_SHA256} from './head-atlas-import.ts';
import {HEAD_LINK_REVISION} from './head-atlas-links.ts';

/** Display eligibility only; never grants access or patient-space registration. */
export function headLinksCurrent(): boolean {
  return typeof HEAD_LINK_REVISION === 'string' && /^[a-f0-9]{64}$/.test(HEAD_LINK_REVISION) && HEAD_LINK_REVISION === HEAD_MANIFEST_SHA256;
}

export const HEAD_LINK_REVISION_NOTICE = 'CT/MRI comparisons and linked tours are temporarily unavailable because the imaging revision has changed. The source mappings must be checked before these links can be used. You can still explore the 3D Atlas.';
