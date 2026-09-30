import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '65b4ec9f3928a42f3a5c550ccd9f3fda4a213938fc0764e5b47b75b4ecda65e6',
} as const satisfies AtlasDeliveryPolicy;
