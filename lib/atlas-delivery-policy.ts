import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '8cd51e8a3f7fb41f9f137e3e8e91cda74034e61843c3086580d0e99cdffaca62',
} as const satisfies AtlasDeliveryPolicy;
