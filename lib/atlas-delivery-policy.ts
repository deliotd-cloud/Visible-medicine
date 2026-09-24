import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '366cb59d687410e5983638663adc0ae9cf0db0cb38eb0405daa66e6c30e257ce',
} as const satisfies AtlasDeliveryPolicy;
