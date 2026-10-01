import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ff7bdfd8cfafe6cd9a22e6d151b23faedd4ac2615c23a56778f7f8c020656eed',
} as const satisfies AtlasDeliveryPolicy;
