import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6d5eb41d58f74a6fae54d72ff00216ea7fdb30dc88a5b2cf82a307ea573a0c3a',
} as const satisfies AtlasDeliveryPolicy;
