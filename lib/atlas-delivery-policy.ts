import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f0bcbb7072c76826a608be1d34367cfb745cb02f2fca669ecf7a0e2464dc62c1',
} as const satisfies AtlasDeliveryPolicy;
