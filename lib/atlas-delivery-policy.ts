import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'de7607c5a5e984949d6836dc633a3b1eb8bc1d24fbf29476376f744d34171171',
} as const satisfies AtlasDeliveryPolicy;
