import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9f686f1a2c9909bba2b46b1b76805aa8168287c4aa4d0f420e942b3fb7c90e2c',
} as const satisfies AtlasDeliveryPolicy;
