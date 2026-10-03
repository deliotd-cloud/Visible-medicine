import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4c4600f27595c69bab2694e795b14ebcafc02e44c49d285a2aa5d9af64955652',
} as const satisfies AtlasDeliveryPolicy;
