import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5930be345cb1bca0e0a8f73cad71fdeb2832eeb5bdd2216752b3ead2d56c0285',
} as const satisfies AtlasDeliveryPolicy;
