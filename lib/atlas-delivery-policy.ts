import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ad5f7dd9c89aa562526243291757894b4e83c9ed59705ca4df9a2f4bb09629e2',
} as const satisfies AtlasDeliveryPolicy;
