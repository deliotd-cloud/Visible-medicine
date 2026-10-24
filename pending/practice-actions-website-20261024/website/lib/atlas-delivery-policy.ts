import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'dbcbceafed7d04e550a6213d4549c33de9b79ea39b5581a1a42b6c79684ccd51',
} as const satisfies AtlasDeliveryPolicy;
