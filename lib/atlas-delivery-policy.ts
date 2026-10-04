import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2aa0fa4f1e0a203cde97b6024d1d2e5379b42352221cc30d7a2977f87d5de975',
} as const satisfies AtlasDeliveryPolicy;
