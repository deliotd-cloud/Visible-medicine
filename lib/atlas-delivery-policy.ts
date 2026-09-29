import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '835c4708fce52aa195bd625ad6832569f8d301aa300d7985f07ca09ba70910b6',
} as const satisfies AtlasDeliveryPolicy;
