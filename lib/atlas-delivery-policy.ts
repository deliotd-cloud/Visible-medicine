import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '72404067f69536085697b84b69d89d8d21eb7f43fec32deaef6207ee77154b95',
} as const satisfies AtlasDeliveryPolicy;
