import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2d209f3bcdd12feb4cf6b137ae1b43ab33f8faa7bec4fae1177c3c9cee2a0710',
} as const satisfies AtlasDeliveryPolicy;
