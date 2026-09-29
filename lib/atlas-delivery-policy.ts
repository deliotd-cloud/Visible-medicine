import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a697f1ecac35728679345729ecc19a84e2580a9ba54932652ab2b24d1bcd06e6',
} as const satisfies AtlasDeliveryPolicy;
