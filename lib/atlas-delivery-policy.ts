import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '2c9bd8dcd6c99d341d68f9ebd4cee010cb3b07b2a50c921c1c9badd450b65ae3',
} as const satisfies AtlasDeliveryPolicy;
