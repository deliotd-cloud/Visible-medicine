import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '40390c40872a9b197990b072bea87e09ed4813997c1f591d6dc57ff92addb89b',
} as const satisfies AtlasDeliveryPolicy;
