import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd689cc1ede3a1edb45637c16705790076cfaad7aed5f67e5449fc99c940ebff6',
} as const satisfies AtlasDeliveryPolicy;
