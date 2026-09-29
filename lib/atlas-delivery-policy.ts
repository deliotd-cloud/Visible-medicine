import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '1389deb215622cd207f996424c6a4e16c44c1ff0762a42f11d27e11e91f8eece',
} as const satisfies AtlasDeliveryPolicy;
