import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd603d30e4703319be0e4f094a7d4bacaad4f828c0743c1d2167ebc4ad074888d',
} as const satisfies AtlasDeliveryPolicy;
