import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7da5c6463d8fa6f6d16e5fa58d07d7a68e4e9860fd2f90b4531fd66a985df733',
} as const satisfies AtlasDeliveryPolicy;
