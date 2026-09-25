import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '24a00affbce4e48a66277533cb50501ebd1a0132e028501c40013e2be5358f47',
} as const satisfies AtlasDeliveryPolicy;
