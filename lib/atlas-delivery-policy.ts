import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c74d98e58c1de7ba2fc081f21b7876cca9eec8b383a8df076aacbd440ead24c3',
} as const satisfies AtlasDeliveryPolicy;
