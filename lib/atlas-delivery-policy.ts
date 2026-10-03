import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'db595d7a3efaaddad69e38d9591fe8d0a3c0347296e9ff2b30c81966d2dca372',
} as const satisfies AtlasDeliveryPolicy;
