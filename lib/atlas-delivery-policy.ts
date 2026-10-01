import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '746e8c107770646b09f92fd9e0bf2f1cf8b1cc6a9bef758077c3a48440ba4302',
} as const satisfies AtlasDeliveryPolicy;
