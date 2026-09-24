import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'c917b5fa0b6aba8261288480766ec45dad5d200bbb62eed63650adaf99ca59c7',
} as const satisfies AtlasDeliveryPolicy;
