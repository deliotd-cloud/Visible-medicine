import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'fd54665ee68558e0b20f0a42e9e61ef0d706a8a4c51f9a69b6d9910027e09808',
} as const satisfies AtlasDeliveryPolicy;
