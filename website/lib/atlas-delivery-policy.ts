import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '129afe2b77498c78b1cf778c0292c97d417522993e41b33b818ef1cdbf721dd9',
} as const satisfies AtlasDeliveryPolicy;
