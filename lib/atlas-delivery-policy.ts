import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '60213c46550b6dd5b5eaf444683f042559ae97871759a39562e15d9d023072a5',
} as const satisfies AtlasDeliveryPolicy;
