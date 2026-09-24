import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7b45168985215b85cc91dc6c3899bd26ef5911c46c801e51422a3bf5c7e7536a',
} as const satisfies AtlasDeliveryPolicy;
