import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '604c50b1b974e735a9b0c99773f76d44acd2f7e6035ebc6f24d553785e203d0d',
} as const satisfies AtlasDeliveryPolicy;
