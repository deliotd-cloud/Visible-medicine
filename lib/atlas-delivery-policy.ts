import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7d31bcb931d8308d4c3ae3ccd6aacb45b3252a9cb7043023edc901f2d6c1a755',
} as const satisfies AtlasDeliveryPolicy;
