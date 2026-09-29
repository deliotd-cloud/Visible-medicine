import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'ea6bbd610bf7bd5b90c23d6440590bcaed93110ecfe3a47ffc5e1c7ba2851351',
} as const satisfies AtlasDeliveryPolicy;
