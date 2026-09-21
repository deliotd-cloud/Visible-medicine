import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cc6fac0decbcb8cb7e3bef6260d85497f0c29b13b44a9f6e1f66d054d5a2cb98',
} as const satisfies AtlasDeliveryPolicy;
