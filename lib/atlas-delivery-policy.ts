import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9dac1e4c6f72ff816a885515ce8397d5311cf6ef48e355cffd9785e32ee5a38f',
} as const satisfies AtlasDeliveryPolicy;
