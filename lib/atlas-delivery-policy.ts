import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b452f2b43d0183f76e20031885795ef034a3cabb856e2643d0e1c44ea839b1dc',
} as const satisfies AtlasDeliveryPolicy;
