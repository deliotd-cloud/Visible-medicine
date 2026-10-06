import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'efe1d0e668b2846a0590c4f3e746873877c319cba410a45a7e026ac4ef91f1f6',
} as const satisfies AtlasDeliveryPolicy;
