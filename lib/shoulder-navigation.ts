const base = '/atlas-runtime/shoulder/index.html';
const prefix = 'vm:anatomy:upper-limb:shoulder:right:';
// Dedicated-shoulder source profile, checked against the imported catalogue.
const identities = new Set([
  ...['scapula','humerus','clavicle'].map(name=>prefix+'bone:'+name),
  ...['deltoid','supraspinatus','infraspinatus','subscapularis','biceps-long-head','teres-minor'].map(name=>prefix+'muscle:'+name),
]);
/** Transport only a known source selection; no arbitrary URLs or access flags. */
export function shoulderModuleHref(structure?: string | string[]): string {
  return typeof structure === 'string' && identities.has(structure)
    ? `${base}?${new URLSearchParams({structure})}` : base;
}
