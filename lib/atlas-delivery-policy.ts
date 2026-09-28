import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '9d497d24a9fc05f10cbbcc3122588866be84332129fcaf414aaf303cb6b192c0',
} as const satisfies AtlasDeliveryPolicy;
