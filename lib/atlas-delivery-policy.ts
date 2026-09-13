import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '376093665a82d5f5add5c537599bd51cf399eb80729768062a2c4f19c3b0f833',
} as const satisfies AtlasDeliveryPolicy;
