import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'f3ff7880a54c5a7601e5e7d0673b7d0abf955901fb4d4eed4e65a349c133ddcb',
} as const satisfies AtlasDeliveryPolicy;
