import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ca10fa6314452ea945ce0e7d80a275f449674caccdb7281d38b753f5a1b332ee',
} as const satisfies AtlasDeliveryPolicy;
