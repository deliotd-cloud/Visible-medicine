import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '92ab0c894caf72a282b5e1189b77c854b94aad3d1970f6a5210feca9edabfe1b',
} as const satisfies AtlasDeliveryPolicy;
