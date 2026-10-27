import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '69b0b383addc22d7b411732eaaa99fbceeec102feb677bb76429bec1c275cf82',
} as const satisfies AtlasDeliveryPolicy;
