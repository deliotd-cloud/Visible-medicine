import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '04b433d0ab76895cc5d6e606b02e15ee446e54ca51d072b0513906a6c6505c91',
} as const satisfies AtlasDeliveryPolicy;
