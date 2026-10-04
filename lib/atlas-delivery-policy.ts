import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '7151ae5ea73eb77507da1199271ca559a5fb997efe59f10b958b741078367bbd',
} as const satisfies AtlasDeliveryPolicy;
