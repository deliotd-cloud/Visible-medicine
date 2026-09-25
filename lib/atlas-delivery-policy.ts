import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '6547f3acf7b916d7a9dec03dc5e4fecc38d50a46a2adecfae38466627223b14f',
} as const satisfies AtlasDeliveryPolicy;
