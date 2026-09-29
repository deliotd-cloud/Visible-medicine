import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5b002972375b8c451dcd28ad00764655a3a0a9cf87d2596390766504a69e3511',
} as const satisfies AtlasDeliveryPolicy;
