import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9ade7cca59999003c366c98ed76b126f43974c6296198643e9da272bd5cf8e5d',
} as const satisfies AtlasDeliveryPolicy;
