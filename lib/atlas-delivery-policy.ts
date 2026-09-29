import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a49aad3e187221ef8e70ca3fbd1b5077e108883901f05e8b40db3639ab845ce7',
} as const satisfies AtlasDeliveryPolicy;
