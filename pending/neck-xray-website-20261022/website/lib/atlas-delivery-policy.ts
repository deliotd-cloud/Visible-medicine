import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b124732b648d336c5fb91f7fd44a64b4c310c9d17b55ed5829f2092485e33b74',
} as const satisfies AtlasDeliveryPolicy;
