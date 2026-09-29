import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: '238933e82afd7cbc317626dc6306c78a3fc8d05cdb7505b8ab15325f09882694',
} as const satisfies AtlasDeliveryPolicy;
