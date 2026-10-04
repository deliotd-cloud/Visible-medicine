import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '044fbbee6982ff0c8f9206b46890cd382e3e1ee5b5da2b662c6b5e2666b475d5',
} as const satisfies AtlasDeliveryPolicy;
