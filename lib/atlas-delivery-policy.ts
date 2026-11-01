import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '0bcbd052054e7186ab6972b338b1658675c088822689c30c1979d8ed56342bcd',
} as const satisfies AtlasDeliveryPolicy;
