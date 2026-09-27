import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '072376eed5062c69970d63062eebe0572273ba495c3fda52eb7e66819b6ec27c',
} as const satisfies AtlasDeliveryPolicy;
