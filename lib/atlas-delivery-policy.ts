import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '23e9ba6429241bc980c9c25f17de2920ea29da4ba8ff675553dd17ea912f77a9',
} as const satisfies AtlasDeliveryPolicy;
