import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '687e8979ef10df49824f14041dec8b55d55fb8ebde75afb6305389a3f7f257a2',
} as const satisfies AtlasDeliveryPolicy;
