import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '92de2aedf670cc6fd431bae28797646aabf50bd8d07867ef6afd71d7d7d22b44',
} as const satisfies AtlasDeliveryPolicy;
