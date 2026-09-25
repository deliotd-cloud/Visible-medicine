import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd701e1ad5f21ab7a218e239e9d690a2efaf0b41ee5ad8a014e7dc65fb7cf03ab',
} as const satisfies AtlasDeliveryPolicy;
