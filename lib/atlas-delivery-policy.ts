import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '52876a2f621cfc49468861c11cd8f3e7e17cba75a71262dad9118b73b3bbe2a1',
} as const satisfies AtlasDeliveryPolicy;
