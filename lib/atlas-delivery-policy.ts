import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ef85f66ee6594e3a84ffbd0c4b474fd28fcf8100153258593496c60283c6c5ee',
} as const satisfies AtlasDeliveryPolicy;
