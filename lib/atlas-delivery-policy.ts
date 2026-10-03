import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c0b358dc8679a0d46dbbc8f969b0b1a2c8bfc7322f2c66c224d5d95e99e691b5',
} as const satisfies AtlasDeliveryPolicy;
