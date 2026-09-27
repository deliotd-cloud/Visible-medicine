import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'dbbd657a418e5deff143b6b947bfcba9a9e1434a1feff22690194ea129e40ff9',
} as const satisfies AtlasDeliveryPolicy;
