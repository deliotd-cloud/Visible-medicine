import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'a4123b66eedc43d90d82acaf36038dee0884d7aa621125f1a097608d439b5b54',
} as const satisfies AtlasDeliveryPolicy;
