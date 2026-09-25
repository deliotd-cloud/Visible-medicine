import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '92f5b85e825a74994bda0b0e9d517ae767983c0b977b527a8f32b3287996f285',
} as const satisfies AtlasDeliveryPolicy;
