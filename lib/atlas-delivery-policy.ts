import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'bc9cf85e9b480f15fbd1b6865543b4d06dc1f7b83c60c3f7c95a4dedbd1bbe46',
} as const satisfies AtlasDeliveryPolicy;
