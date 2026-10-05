import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd1ae88461b3eca1321bd7596bd7d2d722797ec3ff240104d7b5a0960ea0c58dd',
} as const satisfies AtlasDeliveryPolicy;
