import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b561ae0380ed48e943462f6c8c3bc9b172f17b1a1390936971278501a35faf93',
} as const satisfies AtlasDeliveryPolicy;
