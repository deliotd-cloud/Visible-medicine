import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '77f5958918eeea3535517e4f9b49c06b35540b3f810223732ded8e299710f7c0',
} as const satisfies AtlasDeliveryPolicy;
