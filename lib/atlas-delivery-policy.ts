import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '082e231b9c83916fb2aa650d9e04ebf5da8cd6398a91d5ea33e40b33a66270e2',
} as const satisfies AtlasDeliveryPolicy;
