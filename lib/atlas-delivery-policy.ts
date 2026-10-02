import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c634cae5b6e3e6d329f63385c9155daee4dc3e3c672f1e7cc902ceeaa2958da7',
} as const satisfies AtlasDeliveryPolicy;
