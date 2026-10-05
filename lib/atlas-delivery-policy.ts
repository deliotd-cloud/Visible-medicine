import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6175cbf40b12716a305c1722a21632bd3b1dce0133c9a4895f2a256b464c9f0b',
} as const satisfies AtlasDeliveryPolicy;
