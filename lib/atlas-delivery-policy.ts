import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2aa0b25adf611454de1fe0cc27404982cf3313ba8f6cd912d7eb8859254e3ac1',
} as const satisfies AtlasDeliveryPolicy;
