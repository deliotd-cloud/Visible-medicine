import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cecc0fe9cd76840199976d742d47b01efa714803787231706d8d84d7c9e6e82e',
} as const satisfies AtlasDeliveryPolicy;
