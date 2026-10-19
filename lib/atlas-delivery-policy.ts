import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2dca76974378ec8ef41c1f3287d70bb70e26abfcf4e7bba979baf640cdc6eb29',
} as const satisfies AtlasDeliveryPolicy;
