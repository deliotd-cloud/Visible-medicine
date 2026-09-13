import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a28da9e7ecbb8e7ec9c4f234d0b405ea697349ef3c1eae479f4441ce7bf01869',
} as const satisfies AtlasDeliveryPolicy;
