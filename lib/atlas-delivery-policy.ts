import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4c46adc50687612ba170158f0832ac770c5259ef25930ab6ed136a6192ac5e40',
} as const satisfies AtlasDeliveryPolicy;
