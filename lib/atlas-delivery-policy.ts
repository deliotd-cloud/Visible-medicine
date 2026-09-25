import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4bf75e0e44c765672d2dd0692d73a73e4d484e3f9b1232e58b3fd7935304d876',
} as const satisfies AtlasDeliveryPolicy;
