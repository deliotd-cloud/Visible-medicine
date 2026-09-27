import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '94788b2a7c6fb0985ae9477b1ce02fb34313f8520aa9b4a5b1888d496c611c45',
} as const satisfies AtlasDeliveryPolicy;
