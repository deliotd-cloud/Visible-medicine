import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '4ed51c1e4b9e4d521a69673a0724f7ded8b35e06f2273665f8f9d0f53b143ad2',
} as const satisfies AtlasDeliveryPolicy;
