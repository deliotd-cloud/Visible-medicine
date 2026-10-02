import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cf452c41cf888fb259399f5c9c6512a7a87fe4b31bed2709bab1dc71cd668e93',
} as const satisfies AtlasDeliveryPolicy;
