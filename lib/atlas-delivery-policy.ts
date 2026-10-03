import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'e1f1dd5b58581b8a1e8dbffd9057a6279b380ccfcd15f2238c9909e53b5ad4e8',
} as const satisfies AtlasDeliveryPolicy;
