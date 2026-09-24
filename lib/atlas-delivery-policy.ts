import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bf18d0f5968a301fe227fc479c47e281b55a880c90a4967d623abb012a9d1bd6',
} as const satisfies AtlasDeliveryPolicy;
