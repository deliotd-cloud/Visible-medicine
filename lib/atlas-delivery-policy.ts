import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7d492ebce7281631876f19bcfc4b43f0d407638d5413d263e628286f6085d361',
} as const satisfies AtlasDeliveryPolicy;
