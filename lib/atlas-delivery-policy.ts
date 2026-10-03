import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fe6ef98c7a586d83d3b27291f60bfb10fb758585f4e8834b7f59987fe6cd7cb3',
} as const satisfies AtlasDeliveryPolicy;
