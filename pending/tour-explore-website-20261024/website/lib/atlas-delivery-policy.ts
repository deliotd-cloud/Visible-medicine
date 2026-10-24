import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6a9ab278f1d231f63291f07d4adf5d7a9fc963bfe047dfdea6ee01d677e9eea5',
} as const satisfies AtlasDeliveryPolicy;
