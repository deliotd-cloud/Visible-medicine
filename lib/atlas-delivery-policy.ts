import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5161ca91a6b29d9e3a33961899a681f340f679d7b8204de611ef6e36e3e675c1',
} as const satisfies AtlasDeliveryPolicy;
