import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1a3a1ed5b5a5df9e3ee3dcabe808a13030829f102b7272381f9b64d540aa26c9',
} as const satisfies AtlasDeliveryPolicy;
