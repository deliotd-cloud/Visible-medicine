import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e6e07066329d93c212692e7ce84b0fe02a70fbbf6db404301bba32da0420e746',
} as const satisfies AtlasDeliveryPolicy;
