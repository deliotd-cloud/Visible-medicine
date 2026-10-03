import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '5b0be4dd0d3dafb8674fdb03d5da257a35369b7283c2675475ed579269eca61c',
} as const satisfies AtlasDeliveryPolicy;
