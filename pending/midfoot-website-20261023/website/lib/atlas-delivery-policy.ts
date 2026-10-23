import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ed2c1fc42da0146599b3b05005a6485ee8b7bafe27552e18c3ec11df8ba3975e',
} as const satisfies AtlasDeliveryPolicy;
