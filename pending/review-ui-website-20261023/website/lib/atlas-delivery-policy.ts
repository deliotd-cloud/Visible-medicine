import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '8ae33c328a776f7e3cd5fc6c2abec6489134bef8d2aceae7b1082f33bc6c8ed7',
} as const satisfies AtlasDeliveryPolicy;
