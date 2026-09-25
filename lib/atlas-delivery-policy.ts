import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '885e47c1d5064fd73f1da427d3176b4e507bacf177bf7bc56f1d43c10ad95844',
} as const satisfies AtlasDeliveryPolicy;
