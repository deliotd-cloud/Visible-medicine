import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2ebf38ea1727bf08a2b26096422958f2fe45f6c19724899f169da071b66d91d1',
} as const satisfies AtlasDeliveryPolicy;
