import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'dda529950dcdf806138939d06adde2666e165d5c7a714a7cd75bdfcca94ca2e5',
} as const satisfies AtlasDeliveryPolicy;
