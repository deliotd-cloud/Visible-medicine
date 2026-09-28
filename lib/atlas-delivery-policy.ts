import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '630718b6f43842e893a7a2733da3eb9ca1390b0808b79a4e5421201da1f3c74d',
} as const satisfies AtlasDeliveryPolicy;
