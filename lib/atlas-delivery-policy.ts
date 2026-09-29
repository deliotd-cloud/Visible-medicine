import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '266fc9a1850897c0341f96b2d024911d6eda21c8d0f2f3d9ecb20e3c3a3088b3',
} as const satisfies AtlasDeliveryPolicy;
