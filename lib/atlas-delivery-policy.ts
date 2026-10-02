import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'aea458977ec762fa63b6d76ac610e296b8d8cc54eb92d4d07cc26c3a56a79c09',
} as const satisfies AtlasDeliveryPolicy;
