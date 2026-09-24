import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b4b91927b37958f446aadb50e83d6a5698b01cf78bcd65fc8f344cf59d13072b',
} as const satisfies AtlasDeliveryPolicy;
