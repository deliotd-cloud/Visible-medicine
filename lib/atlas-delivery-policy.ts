import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '40b5ab66c4195b40185edc443fc038ac9f0140237487bcba43ace6b12012ff98',
} as const satisfies AtlasDeliveryPolicy;
