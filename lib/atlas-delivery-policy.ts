import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b36dfa48a7957c41e87b2f3fee8e68ed34c091dd5aaf3a6c8ab3b3199a94310e',
} as const satisfies AtlasDeliveryPolicy;
