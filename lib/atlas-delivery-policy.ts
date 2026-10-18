import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'afa36a4cfa35ed4e283bfc6ece64b6799c29c3eace85c6339e9cadc16752f73f',
} as const satisfies AtlasDeliveryPolicy;
