import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '553b5cbef2807ae8911e79d651d91d101f3372bd3af874e4a3a947c1a9492bd2',
} as const satisfies AtlasDeliveryPolicy;
