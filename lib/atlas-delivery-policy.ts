import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'b728dcca72fd234ebb000104ad5a618e8f84b67e03b26d793aba9b90ffde11b2',
} as const satisfies AtlasDeliveryPolicy;
