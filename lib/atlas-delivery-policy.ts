import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '3cc4c2d1d0df472c3c6bd2e0690c393fc02fd75c74bba97753f552087d8569f5',
} as const satisfies AtlasDeliveryPolicy;
