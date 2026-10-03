import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '268fea0973c5e2ee55dedcfc85a608e3515266e4fea419d531cd12c865e7a16f',
} as const satisfies AtlasDeliveryPolicy;
