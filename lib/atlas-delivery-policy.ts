import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '06a1b36b946255d9d19b28d34cfa6b580f8a454a1d49c44d67a0fae2c3cd63cc',
} as const satisfies AtlasDeliveryPolicy;
