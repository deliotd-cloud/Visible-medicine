import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd5cde04e74601f3ad3b09216a5a187908e08ba0e3eb314605213bb0979b9cf5c',
} as const satisfies AtlasDeliveryPolicy;
