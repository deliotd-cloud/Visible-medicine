import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a446e2843f6178bbbb715611b5c325281450755ae9b55f37d598e811b675d09a',
} as const satisfies AtlasDeliveryPolicy;
