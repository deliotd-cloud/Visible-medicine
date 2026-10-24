import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'cadbd6a63a0295b02e894772d38f81ced29bca3bd232cc23321e7269b367a948',
} as const satisfies AtlasDeliveryPolicy;
