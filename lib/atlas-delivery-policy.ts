import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'd60fea8cbf4803d5e58170d810d0a95ba3e2a208ddd97dca3f1e34417c427f5a',
} as const satisfies AtlasDeliveryPolicy;
