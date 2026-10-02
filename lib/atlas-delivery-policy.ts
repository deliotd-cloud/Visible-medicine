import type { AtlasDeliveryPolicy } from './atlas-delivery-access.ts';

// Registered source bytes are locally verified; new bundles must be staged and
// checked before this candidate is deployed. No clinical release is granted.
// Keep the private draft available only to review staff.
export const ATLAS_DELIVERY_POLICY = {
  audience: 'administrator-review',
  manifestRevision: 'de43a6ffc88eba28d5d361c10dc66c2bd57d85a54adc12fc9045e5553ad939dc',
} as const satisfies AtlasDeliveryPolicy;
